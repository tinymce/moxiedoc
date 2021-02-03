import { Api } from './api';
import { Parser } from './parser';
import * as Reporter from './reporter';

export interface Tag {
  name: string;
  text: string;
}

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
  public static tags: Record<string, Function> = {};
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
  public currentMember = null;
  /**
   * Current type instance or null.
   *
   * @member {Object} currentType
   */
  public currentType = null;
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
  public target =  null;

  /**
   * Adds aliases for tags.
   *
   * @static
   * @method addAliases
   * @param {Object} aliases Name/value of aliases.
   */
  public static addAliases(aliases: Record<string, string>) {
    for (const name in aliases) {
      const alias = aliases[name];

      /*jshint loopfunc:true */
      name.split(' ').forEach((name) => {
        Builder.tags[name] = (text) => {
          Builder.tags[alias].call(this, text, alias);
        };
      });
    }
  };

  /**
   * Adds a boolean tag type.
   *
   * @static
   * @method addBoolTag
   * @param {String/Array} name Tag name, space separates list or array of tag names.
   */
  public static addBoolTag(name: string) {
    Builder.addTag(name, function(text, name) {
      this.target[name] = true;
    });
  };

  /**
   * Adds a list of tags that control the member type for example 'method'.
   *
   * @method addMemberTags
   * @static
   * @param {String} names Space separated list of types that control the member type.
   */
  public static addMemberTags(names: string) {
    names.split(' ').forEach((name) => {
      Builder.memberTags[name] = true;
    });
  };

  /**
   * Adds a simple string tag type.
   *
   * @static
   * @method addStringTag
   * @param {String/Array} name Tag name, space separates list or array of tag names.
   */
  public static addStringTag(name: string) {
    Builder.addTag(name, function(text, name) {
      this.target[name] = text;
    });
  };

  /**
   * Adds a new tag type by name. The callback will be executed when
   * the specified tag is found in a comment block.
   *
   * @method addTag
   * @static
   * @param {String/Array} name Tag name, space separates list or array of tag names.
   * @param {Function} callback Callback to be executed when a tag of that type is found.
   */
  public static addTag(name: string | string[], callback: (this: Builder, text: string, name: string, tags: Tag[]) => void) {
    if (name instanceof Array) {
      name.forEach((name) => Builder.addTag(name, callback));
    } else {
      name.split(' ').forEach((name) => {
        Builder.tags[name.toLowerCase()] = callback;
      });
    }
  };


  /**
   * Adds a list of tags that control the type for example 'class'.
   *
   * @method addTypeTags
   * @static
   * @param {String} names Space separated list of types that control the type.
   */
  public static addTypeTags(names: string) {
    names.split(' ').forEach((name) => {
      Builder.typeTags[name] = true;
    });
  };

  /**
   * Constructs a new Builder instance.
   *
   * @constructor
   */
  constructor () {
    let currentBlock: Tag[], ignoreFile: boolean, self = this;

    this.parser.on('parse', function () {
      ignoreFile = false;
      Reporter.info('Parsing file:', this.info.filePath);
    });

    this.parser.on('start', function (text) {
      currentBlock = [{ name: 'desc', text: text }];
    });

    this.parser.on('end', function () {
      let memberOrType: boolean, accessLevelTag: { name: string; text: string; }, isIncludeBlock: boolean;

      if (ignoreFile) {
        return;
      }

      function getSummary (desc: string) {
        let pos = desc.indexOf('.');

        if (pos > 100 || pos === -1) {
          pos = 100;
        }

        return desc.substr(0, pos);
      }

      currentBlock.forEach((tag) => {
        let callback: { call: (arg0: any, arg1: any, arg2: string, arg3: { name: string; text: string; }[]) => void; }, multiple: boolean;

        if (!memberOrType && Builder.typeTags[ tag.name ] === true) {
          callback = Builder.tags[tag.name];

          if (callback) {
            callback.call(self, tag.text, tag.name, currentBlock);
            memberOrType = true;
          }
        }

        // TODO: Rework this
        multiple = tag.name === 'property' || tag.name === 'setting';

        if ((multiple || !memberOrType) && Builder.memberTags[ tag.name ] === true) {
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

      currentBlock.forEach((tag: { name: string; text: string; }) => {
        if (Builder.typeTags[tag.name] || Builder.memberTags[tag.name]) {
          return;
        }

        const callback = Builder.tags[ tag.name ];

        if (callback) {
          callback.call(self, tag.text, tag.name, currentBlock);
        } else if (tag.name.indexOf('-x') !== 0) {
          Reporter.info('Unknown tag:', tag.name, 'File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
        }
      });

      self.target.source = { line: this.info.line, file: this.info.filePath };
      self.target.summary = self.target.summary || getSummary(self.target.desc);
    });

    this.parser.on('tag', function (name: string, text: string) {
      if (name === 'ignore-file') {
        ignoreFile = true;
      }

      currentBlock.push({ name: name, text: text });
    });
  }
}

export {
  Builder
};
