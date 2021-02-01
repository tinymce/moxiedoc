import { Parser } from './parser';
import { Api } from './api';
import * as reporter from './reporter';

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

/**
 * Constructs a new Builder instance.
 *
 * @constructor
 */
function Builder(this: Record<string, any>) {
  let currentBlock: { name: string; text: string; }[], ignoreFile: boolean, self = this;

  this.reporter = reporter;

  /**
   * Api instance that holds all global types etc.
   *
   * @member {moxiedoc.Api} api
   */
  this.api = new Api();

  /**
   * Current target type or member or null.
   *
   * @member {Object} target
   */
  this.target = null;

  /**
   * Current type instance or null.
   *
   * @member {Object} currentType
   */
  this.currentType = null;

  /**
   * Current member or null.
   *
   * @member {Object} currentMember
   */
  this.currentMember = null;

  /**
   * Current parser instance.
   *
   * @member {Object} parser
   */
  this.parser = new Parser();

  this.parser.on('parse', function() {
    ignoreFile = false;
    reporter.info('Parsing file:', this.info.filePath);
  });

  this.parser.on('start', function(text: string) {
    currentBlock = [{name: 'desc', text: text}];
  });

  this.parser.on('end', function() {
    let memberOrType: boolean, accessLevelTag: { name: string; text: string; }, isIncludeBlock: boolean;

    if (ignoreFile) {
      return;
    }

    function getSummary(desc: string) {
      let pos = desc.indexOf('.');

      if (pos > 100 || pos === -1) {
        pos = 100;
      }

      return desc.substr(0, pos);
    }

    currentBlock.forEach((tag: { name: string; text: string; }) => {
        let callback: { call: (arg0: any, arg1: any, arg2: string, arg3: { name: string; text: string; }[]) => void; }, multiple: boolean;

        if (!memberOrType && Builder.typeTags[tag.name] === true) {
          callback = Builder.tags[tag.name];

          if (callback) {
            callback.call(self, tag.text, tag.name, currentBlock);
            memberOrType = true;
          }
        }

        // TODO: Rework this
        multiple = tag.name === 'property' || tag.name === 'setting';

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
        reporter.warn('Not a type/member. File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
      } else {
        reporter.debug('Empty block. File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
      }

      return;
    }

    currentBlock.forEach((tag: { name: string; text: string; }) => {
        if (Builder.typeTags[tag.name] || Builder.memberTags[tag.name]) {
          return;
        }

        const callback = Builder.tags[tag.name];

        if (callback) {
          callback.call(self, tag.text, tag.name, currentBlock);
        } else if (tag.name.indexOf('-x') !== 0) {
          reporter.info('Unknown tag:', tag.name, 'File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
        }
      });

    self.target.source = {line: this.info.line, file: this.info.filePath};
    self.target.summary = self.target.summary || getSummary(self.target.desc);
  });

  this.parser.on('tag', function(name: string, text: string) {
    if (name === 'ignore-file') {
      ignoreFile = true;
    }

    currentBlock.push({name: name, text: text});
  });
}

Builder.typeTags = {};
Builder.memberTags = {};

/**
 * Name/value collection of tag handlers.
 *
 * @member {Object} tags
 */
Builder.tags = {};

/**
 * Adds a list of tags that control the type for example 'class'.
 *
 * @method addTypeTags
 * @static
 * @param {String} names Space separated list of types that control the type.
 */
Builder.addTypeTags = function(names: string) {
  names.split(' ').forEach((name: string | number) => {
      Builder.typeTags[name] = true;
    });
};

/**
 * Adds a list of tags that control the member type for example 'method'.
 *
 * @method addMemberTags
 * @static
 * @param {String} names Space separated list of types that control the member type.
 */
Builder.addMemberTags = function(names: string) {
  names.split(' ').forEach((name: string | number) => {
      Builder.memberTags[name] = true;
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
Builder.addTag = function(name: string | string[], callback: any) {
  if (name instanceof Array) {
    name.forEach(Builder.addTag);
  } else {
    name.split(' ').forEach((name: string) => {
        Builder.tags[name.toLowerCase()] = callback;
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
Builder.addBoolTag = function(name: string) {
  Builder.addTag(name, function(text: string, name: string | number) {
    this.target[name] = true;
  });
};

/**
 * Adds a simple string tag type.
 *
 * @static
 * @method addStringTag
 * @param {String/Array} name Tag name, space separates list or array of tag names.
 */
Builder.addStringTag = function(name: string) {
  Builder.addTag(name, function(text: string, name: string | number) {
    this.target[name] = text;
  });
};

/**
 * Adds aliases for tags.
 *
 * @static
 * @method addAliases
 * @param {Object} aliases Name/value of aliases.
 */
Builder.addAliases = function(aliases: { [x: string]: string; }) {
  for (const name in aliases) {
    const alias = aliases[name];

    /*jshint loopfunc:true */
    name.split(' ').forEach((name) => {
        Builder.tags[name] = function (text: string) {
          Builder.tags[alias].call(this, text, alias);
        };
      });
  }
};

export {
  Builder
};
