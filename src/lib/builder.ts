import { Api } from './api';
import { Member } from './member';
import { Parser } from './parser';
import * as Reporter from './reporter';
import { Target } from './target';
import { Type } from './type';

export interface Tag {
  name: string;
  text: string;
}

type AddTagCallback = (this: Builder, text: string, name: string, tags: Tag[]) => void;

/**
 * This class build a API structure in JSON format by parsing files.
 *
 * @example
 * var builder = new Builder();
 *
 * builder.parser.parseFile('somefile.js');
 *
 * console.log(builder.toJSON());
 *
 * @class moxiedoc.Builder
 */
class Builder {
  public static memberTags: Record<string, boolean> = {};
  /**
   * Name/value collection of tag handlers.
   *
   * @member {Object} tags
   */
  public static tags: Record<string, AddTagCallback> = {};
  public static typeTags: Record<string, boolean> = {};

  /**
   * Api instance that holds all global types etc.
   *
   * @member {moxiedoc.Api} api
   */
  public api: Api = new Api();
  /**
   * Current member or null.
   *
   * @member {Object} currentMember
   */
  public currentMember: Member | null = null;
  /**
   * Current type instance or null.
   *
   * @member {Object} currentType
   */
  public currentType: Type | null = null;
  /**
   * Current parser instance.
   *
   * @member {Object} parser
   */
  public parser = new Parser();
  public reporter = Reporter;
  /**
   * Current target type or member or null.
   *
   * @member {Object} target
   */
  public target: Target | null = null;

  /**
   * Constructs a new Builder instance.
   *
   * @constructor
   */
  public constructor() {
    let currentBlock: Tag[];
    let ignoreFile: boolean;
    const self = this;

    this.parser.on('parse', function (this: Parser) {
      ignoreFile = false;
      Reporter.info('Parsing file:', this.info.filePath);
    });

    this.parser.on('start', (text: string) => {
      currentBlock = [{ name: 'desc', text }];
    });

    this.parser.on('end', function () {
      let memberOrType: boolean;
      let accessLevelTag: Tag;
      let isIncludeBlock: boolean;

      if (ignoreFile) {
        return;
      }

      const getSummary = (desc: string) => {
        let pos = desc.indexOf('.');

        if (pos > 100 || pos === -1) {
          pos = 100;
        }

        return desc.substr(0, pos);
      };

      currentBlock.forEach((tag) => {
        let callback: AddTagCallback;

        if (!memberOrType && Builder.typeTags[tag.name] === true) {
          callback = Builder.tags[tag.name];

          if (callback) {
            callback.call(self, tag.text, tag.name, currentBlock);
            memberOrType = true;
          }
        }

        // TODO: Rework this
        const multiple = tag.name === 'property' || tag.name === 'setting';

        if ((multiple || !memberOrType) && Builder.memberTags[tag.name] === true) {
          callback = Builder.tags[tag.name];

          if (callback) {
            callback.call(self, tag.text, tag.name, currentBlock);
            memberOrType = true;
          }
        }

        if (tag.name === 'private' || tag.name === 'protected') {
          accessLevelTag = tag;
        }

        if (tag.name === 'include') {
          Builder.tags.include.call(self, tag.text, tag.name, currentBlock);
          isIncludeBlock = true;
        }
      });

      if (accessLevelTag && memberOrType) {
        const callback = Builder.tags[accessLevelTag.name];

        if (callback) {
          callback.call(self, accessLevelTag.text, accessLevelTag.name, currentBlock);
        }
      }

      if ((accessLevelTag && accessLevelTag.name === 'private') || isIncludeBlock) {
        return;
      }

      if (!memberOrType) {
        if (currentBlock.length > 1) {
          Reporter.warn('Not a type/member. File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
        } else {
          Reporter.debug('Empty block. File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
        }

        return;
      }

      currentBlock.forEach((tag) => {
        if (Builder.typeTags[tag.name] || Builder.memberTags[tag.name]) {
          return;
        }

        const callback = Builder.tags[tag.name];

        if (callback) {
          callback.call(self, tag.text, tag.name, currentBlock);
        } else if (tag.name.indexOf('-x') !== 0) {
          Reporter.info('Unknown tag:', tag.name, 'File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
        }
      });

      self.target.source = { line: this.info.line, file: this.info.filePath };
      self.target.summary = self.target.summary || getSummary(self.target.desc);
    });

    this.parser.on('tag', (name: string, text: string) => {
      if (name === 'ignore-file') {
        ignoreFile = true;
      }

      currentBlock.push({ name, text });
    });
  }

  /**
   * Adds aliases for tags.
   *
   * @static
   * @method addAliases
   * @param {Object} aliases Name/value of aliases.
   */
  public static addAliases(aliases: Record<string, string>): void {
    for (const key in aliases) {
      if (aliases.hasOwnProperty(key)) {
        const alias = aliases[key];

        key.split(' ').forEach((name) => {
          Builder.tags[name] = (text, _name, tags) => {
            Builder.tags[alias].call(this, text, alias, tags);
          };
        });
      }
    }
  }

  /**
   * Adds a boolean tag type.
   *
   * @static
   * @method addBoolTag
   * @param {String/Array} name Tag name, space separates list or array of tag names.
   */
  public static addBoolTag(name: string): void {
    Builder.addTag(name, function (text, tagName) {
      this.target[tagName] = true;
    });
  }

  /**
   * Adds a list of tags that control the member type for example 'method'.
   *
   * @method addMemberTags
   * @static
   * @param {String} names Space separated list of types that control the member type.
   */
  public static addMemberTags(names: string): void {
    names.split(' ').forEach((name) => {
      Builder.memberTags[name] = true;
    });
  }

  /**
   * Adds a simple string tag type.
   *
   * @static
   * @method addStringTag
   * @param {String/Array} name Tag name, space separates list or array of tag names.
   */
  public static addStringTag(name: string): void {
    Builder.addTag(name, function (text, tagName) {
      this.target[tagName] = text;
    });
  }

  /**
   * Adds a new tag type by name. The callback will be executed when
   * the specified tag is found in a comment block.
   *
   * @method addTag
   * @static
   * @param {String/Array} names Tag name, space separates list or array of tag names.
   * @param {Function} callback Callback to be executed when a tag of that type is found.
   */
  public static addTag(names: string | string[], callback: AddTagCallback): void {
    if (names instanceof Array) {
      names.forEach((name) => Builder.addTag(name, callback));
    } else {
      names.split(' ').forEach((name) => {
        Builder.tags[name.toLowerCase()] = callback;
      });
    }
  }

  /**
   * Adds a list of tags that control the type for example 'class'.
   *
   * @method addTypeTags
   * @static
   * @param {String} names Space separated list of types that control the type.
   */
  public static addTypeTags(names: string): void {
    names.split(' ').forEach((name) => {
      Builder.typeTags[name] = true;
    });
  }
}

// Important: This must use a require, as this needs to be immediately imported to setup the tags
require('./tags');

export {
  Builder
};
