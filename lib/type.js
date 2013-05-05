/**
 * Type class contains details about classes, enums, structs etc.
 *
 * @class moxiedoc.Type
 */

/**
 * Constructs a new Type instance.
 *
 * @constructor
 * @param {Object} data Json structure with type data.
 */
function Type(data) {
	this.data = data;

	this.fullName = data.fullName;
	this.name = data.name = data.fullName.split('.').pop();
	this.type = data.type;
	this.summary = data.summary;

	this.members = [];
}

/**
 * Adds a new member to the type.
 *
 * @method addMember
 * @param {MemberInfo} member MemberInfo instance to add to type.
 * @return {MemberInfo} Member info instance that was passed in.
 */
Type.prototype.addMember = function(member) {
	this.members.push(member);

	return member;
};

Type.prototype.getMembers = function() {
	return this.members;
};

/**
 * Returns an array of the members by the specified type.
 *
 * @method getMembersByType
 * @param {String} type Type name to get members by.
 * @return {Array} Array of members of the type MemberInfo.
 */
Type.prototype.getMembersByType = function(type) {
	var members = [];

	this.members.forEach(function(memberInfo) {
		if (memberInfo.data.type == type) {
			members.push(memberInfo);
		}
	});

	return members;
};

/**
 * Returns an array of constructors some languages might have multiple due to overloading.
 *
 * @method getConstructors
 * @return {Array} Array of constructors of the type MemberInfo.
 */
Type.prototype.getConstructors = function() {
	return this.getMembersByType('constructor');
};

/**
 * Returns an array of methods.
 *
 * @method getMethods
 * @return {Array} Array of methods of the type MemberInfo.
 */
Type.prototype.getMethods = function() {
	return this.getMembersByType('method');
};

/**
 * Returns an array of properties.
 *
 * @method getProperties
 * @return {Array} Array of properties of the type MemberInfo.
 */
Type.prototype.getProperties = function() {
	return this.getMembersByType('property');
};

/**
 * Returns an array of events.
 *
 * @method getProperties
 * @return {Array} Array of events of the type MemberInfo.
 */
Type.prototype.getEvents = function() {
	return this.getMembersByType('event');
};

/**
 * Returns an array of fields.
 *
 * @method getFields
 * @return {Array} Array of fields of the type MemberInfo.
 */
Type.prototype.getFields = function() {
	return this.getMembersByType('field');
};

/**
 * Serializes the Type as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Type.prototype.toJSON = function() {
	var json = {};

	for (var name in this.data) {
		json[name] = this.data[name];
	}

	json.members = [];
	this.members.forEach(function(memberInfo) {
		json.members.push(memberInfo.toJSON());
	});

	return json;
};

exports.Type = Type;
