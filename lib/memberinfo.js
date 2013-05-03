/**
 * MemberInfo class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.MemberInfo
 */

/**
 * Constructs a new MemberInfo instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function MemberInfo(data) {
	this.data = data;
	this.params = [];
	this.name = data.name;
	this.type = data.type;
	this.summary = data.summary;
}

/**
 * Adds a new parameter to the member.
 *
 * @method addParam
 * @param {ParamInfo} paramInfo Parameter info instance.
 * @return {ParamInfo} Param info instance that got passed in.
 */
MemberInfo.prototype.addParam = function(paramInfo) {
	this.params.push(paramInfo);

	return paramInfo;
};

/**
 * Returns an array of parameters.
 *
 * @method getParams
 * @return {Array} Array of ParamInfo instances.
 */
MemberInfo.prototype.getParams = function() {
	return this.params;
};

/**
 * Serializes the MemberInfo as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
MemberInfo.prototype.toJSON = function() {
	var json = {};

	for (var name in this.data) {
		json[name] = this.data[name];
	}

	json.params = [];
	this.params.forEach(function(paramInfo) {
		json.params.push(paramInfo.toJSON());
	});

	return json;
};

exports.MemberInfo = MemberInfo;

