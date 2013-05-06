var Param = require("./param").Param;

/**
 * Member class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Member
 */

/**
 * Constructs a new Member instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function Member(data) {
	var self = this;

	this.data = data;
	this.params = [];
	this.name = data.name;
	this.type = data.type;
	this.summary = data.summary;
	this.dataTypes = data.dataTypes;

	if (data.params) {
		data.params.forEach(function(data) {
			self.addParam(new Param(data));
		});
	}
}

/**
 * Adds a new parameter to the member.
 *
 * @method addParam
 * @param {Param} paramInfo Parameter info instance.
 * @return {Param} Param info instance that got passed in.
 */
Member.prototype.addParam = function(param) {
	this.params.push(param);

	return param;
};

/**
 * Returns an array of parameters.
 *
 * @method getParams
 * @return {Array} Array of Param instances.
 */
Member.prototype.getParams = function() {
	return this.params;
};

/**
 * Returns true/false if the member is static.
 *
 * @method isStatic
 * @return {Boolean} Static state.
 */
Member.prototype.isStatic = function() {
	return !!this.data.static;
};

/**
 * Serializes the Member as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Member.prototype.toJSON = function() {
	var json = {};

	for (var name in this.data) {
		json[name] = this.data[name];
	}

	json.params = [];
	this.params.forEach(function(param) {
		json.params.push(param.toJSON());
	});

	return json;
};

Member.prototype.clone = function() {
	return new Member(this.toJSON());
};

exports.Member = Member;

