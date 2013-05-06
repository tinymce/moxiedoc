/**
 * Param class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Param
 */

/**
 * Constructs a new Param instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function Param(data) {
	this.data = data;
	this.params = [];
	this.name = data.name;
	this.types = data.types;
	this.summary = data.summary;
}

/**
 * Serializes the Param as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Param.prototype.toJSON = function() {
	return this.data;
};

exports.Param = Param;

