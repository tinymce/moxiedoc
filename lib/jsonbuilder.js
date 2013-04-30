var Parser = require('./Parser');

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
	this.types = {};
	this.parser = new Parser();
}

/**
 * Returns a JSON structure for the parsed data.
 *
 * @method toJSON
 * @return {Object} JSON struture of the API.
 */
JsonBuilder.prototype.toJSON = function() {
	return this.types;
};

exports.JsonBuilder = JsonBuilder;
