var Parser = require('./parser').Parser;
var Api = require('./api').Api;
var reporter = require('./reporter');

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
function Builder() {
  var currentBlock, ignoreFile, self = this;

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

  this.parser.on('start', function(text) {
    currentBlock = [{name: 'desc', text: text}];
  });

  this.parser.on('end', function() {
    var memberOrType, accessLevelTag, isIncludeBlock;

    if (ignoreFile) {
      return;
    }

    function getSummary(desc) {
      var pos = desc.indexOf('.');

      if (pos > 100 || pos == -1) {
        pos = 100;
      }

      return desc.substr(0, pos);
    }

    currentBlock.forEach(function(tag) {
      var callback, multiple;

      if (!memberOrType && Builder.typeTags[tag.name] === true) {
        callback = Builder.tags[tag.name];

        if (callback) {
          callback.call(self, tag.text, tag.name, currentBlock);
          memberOrType = true;
        }
      }

      // TODO: Rework this
      multiple = tag.name == 'property' || tag.name == 'setting';

      if ((multiple || !memberOrType) && Builder.memberTags[tag.name] === true) {
        callback = Builder.tags[tag.name];

        if (callback) {
          callback.call(self, tag.text, tag.name, currentBlock);
          memberOrType = true;
        }
      }

      if (tag.name == 'private' || tag.name == 'protected') {
        accessLevelTag = tag;
      }

      if (tag.name == 'include') {
        Builder.tags.include.call(self, tag.text, tag.name, currentBlock);
        isIncludeBlock = true;
      }
    });

    if (accessLevelTag && memberOrType) {
      var callback = Builder.tags[accessLevelTag.name];

      if (callback) {
        callback.call(self, accessLevelTag.text, accessLevelTag.name, currentBlock);
      }
    }

    if ((accessLevelTag && accessLevelTag.name == 'private') || isIncludeBlock) {
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

    currentBlock.forEach(function(tag) {
      if (Builder.typeTags[tag.name] || Builder.memberTags[tag.name]) {
        return;
      }

      var callback = Builder.tags[tag.name];

      if (callback) {
        callback.call(self, tag.text, tag.name, currentBlock);
      } else if (tag.name.indexOf('-x') !== 0) {
        reporter.info('Unknown tag:', tag.name, 'File: ' + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
      }
    });

    self.target.source = {line: this.info.line, file: this.info.filePath};
    self.target.summary = self.target.summary || getSummary(self.target.desc);
  });

  this.parser.on('tag', function(name, text) {
    if (name == 'ignore-file') {
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
Builder.addTypeTags = function(names) {
  names.split(' ').forEach(function(name) {
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
Builder.addMemberTags = function(names) {
  names.split(' ').forEach(function(name) {
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
Builder.addTag = function(name, callback) {
  if (name instanceof Array) {
    name.forEach(Builder.addTag);
  } else {
    name.split(' ').forEach(function(name) {
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
Builder.addBoolTag = function(name) {
  Builder.addTag(name, function(text, name) {
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
Builder.addStringTag = function(name) {
  Builder.addTag(name, function(text, name) {
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
Builder.addAliases = function(aliases) {
  for (var name in aliases) {
    var alias = aliases[name];

    /*jshint loopfunc:true */
    name.split(' ').forEach(function(name) {
      Builder.tags[name] = function(text) {
        Builder.tags[alias].call(this, text, alias);
      };
    });
  }
};

exports.Builder = Builder;

require('./tags');
