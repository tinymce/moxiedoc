var Parser = require('./parser').Parser;

/**
 * This class build a API structure in JSON format by parsing files.
 *
 * @example
 * var jsonBuilder = new JsonBuilder();
 *
 * jsonBuilder.parser.parseFile("somefile.js");
 *
 * console.log(jsonBuilder.toJSON());
 *
 * @class moxiedoc.JsonBuilder
 */

/**
 * Constructs a new JsonBuilder instance.
 *
 * @constructor
 */
function JsonBuilder() {
	var currentBlock, self = this;

	/**
	 * Name/value collection with types for example classes and enums.
	 *
	 * @member {Object} types
	 */
	this.types = {};

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

	this.parser.on('start', function(text) {
		currentBlock = [{name: 'desc', text: text}];
	});

	this.parser.on('end', function() {
		var memberOrType;

		currentBlock.forEach(function(tag) {
			var callback;

			if (JsonBuilder.typeTags[tag.name] === true) {
				callback = JsonBuilder.tags[tag.name];

				if (callback) {
					callback.call(self, tag.text, tag.name, currentBlock);
					memberOrType = true;
				}
			}

			if (JsonBuilder.memberTags[tag.name] === true) {
				callback = JsonBuilder.tags[tag.name];

				if (callback) {
					callback.call(self, tag.text, tag.name, currentBlock);
					memberOrType = true;
				}
			}
		});

		if (!memberOrType) {
			throw new Error("Not a type/member. File: " + self.parser.info.filePath + ' (' + self.parser.info.line + ')');
		}

		currentBlock.forEach(function(tag) {
			if (JsonBuilder.typeTags[tag.name] || JsonBuilder.memberTags[tag.name]) {
				return;
			}

			var callback = JsonBuilder.tags[tag.name];

			if (callback) {
				callback.call(self, tag.text, tag.name, currentBlock);
			}
		});

		this.target = this.currentType;
	});

	this.parser.on('tag', function(name, text) {
		currentBlock.push({name: name, text: text});
	});
}

JsonBuilder.typeTags = {};
JsonBuilder.memberTags = {};

/**
 * Name/value collection of tag handlers.
 *
 * @member {Object} tags
 */
JsonBuilder.tags = {};

/**
 * Adds a list of tags that control the type for example "class".
 *
 * @method addTypeTags
 * @static
 * @param {String} names Space separated list of types that control the type.
 */
JsonBuilder.addTypeTags = function(names) {
	names.split(' ').forEach(function(name) {
		JsonBuilder.typeTags[name] = true;
	});
};

/**
 * Adds a list of tags that control the member type for example "method".
 *
 * @method addMemberTags
 * @static
 * @param {String} names Space separated list of types that control the member type.
 */
JsonBuilder.addMemberTags = function(names) {
	names.split(' ').forEach(function(name) {
		JsonBuilder.memberTags[name] = true;
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
JsonBuilder.addTag = function(name, callback) {
	if (name instanceof Array) {
		name.forEach(JsonBuilder.addTag);
	} else {
		name.split(' ').forEach(function(name) {
			JsonBuilder.tags[name.toLowerCase()] = callback;
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
JsonBuilder.addBoolTag = function(name) {
	JsonBuilder.addTag(name, function(text, name) {
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
JsonBuilder.addStringTag = function(name) {
	JsonBuilder.addTag(name, function(text, name) {
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
JsonBuilder.addAliases = function(aliases) {
	for (var name in aliases) {
		var alias = aliases[name];

		/*jshint loopfunc:true */
		name.split(' ').forEach(function(name) {
			JsonBuilder.tags[name] = function(text) {
				JsonBuilder.tags[alias].call(this, text, alias);
			};
		});
	}
};

/**
 * Returns a JSON structure for the parsed data.
 *
 * @method toJSON
 * @return {Object} JSON struture of the API.
 */
JsonBuilder.prototype.toJSON = function() {
	return this.types;
};

function MemberInfo(data) {
	this.data = data;
}

MemberInfo.prototype.toJSON = function() {
	return this.data;
};

function TypeInfo(data) {
	this.data = data;
}

TypeInfo.prototype.toJSON = function() {
	return this.data;
};

JsonBuilder.prototype.createTypeInfo = function(data) {
	return new TypeInfo(data);
};

JsonBuilder.prototype.createMemberInfo = function(data) {
	return new MemberInfo(data);
};

exports.JsonBuilder = JsonBuilder;
