/**
 * ParamInfo class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.ParamInfo
 */

/**
 * Constructs a new ParamInfo instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function ParamInfo(data) {
	this.data = data;
	this.params = [];
	this.name = data.name;
	this.type = data.type;
	this.summary = data.summary;
}

/**
 * Serializes the ParamInfo as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
ParamInfo.prototype.toJSON = function() {
	return this.data;
};

exports.ParamInfo = ParamInfo;

