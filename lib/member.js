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

	function getSummary(desc) {
		var pos = desc.indexOf('.');

		if (pos > 100 || pos == -1) {
			pos = 100;
		}

		return desc.substr(0, pos);
	}

	for (var name in data) {
		this[name] = data[name];
	}

	this._params = [];
	if (data.params) {
		data.params.forEach(function(data) {
			self.addParam(new Param(data));
		});
	}

	if (!this.summary) {
		this.summary = getSummary(this.desc);
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
	this._params.push(param);

	return param;
};

/**
 * Returns an array of parameters.
 *
 * @method getParams
 * @return {Array} Array of Param instances.
 */
Member.prototype.getParams = function() {
	return this._params;
};

/**
 * Returns true/false if the member is static.
 *
 * @method isStatic
 * @return {Boolean} Static state.
 */
Member.prototype.isStatic = function() {
	return !!this.static;
};

Member.prototype.getParentType = function() {
	return this._parentType;
};

/**
 * Serializes the Member as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Member.prototype.toJSON = function() {
	var json = {};

	for (var name in this) {
		if (typeof(this[name]) != 'function' && name.indexOf('_') !== 0) {
			json[name] = this[name];
		}
	}

	json.params = [];
	this._params.forEach(function(param) {
		json.params.push(param.toJSON());
	});

	return json;
};

Member.prototype.clone = function() {
	var parentType = this._parentType;

	var clone = new Member(this.toJSON());
	clone._parentType = parentType;

	return clone;
};

exports.Member = Member;

