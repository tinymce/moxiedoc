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

exports.Member = Member;

