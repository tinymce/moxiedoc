/**
 * Namespace class.
 *
 * @class moxiedoc.Namespace
 */

/**
 * Constructs a new Namespace instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function Namespace(data) {
	this.types = [];
	this.fullName = data.fullName;
	this.summary = data.summary;
	this.namespaces = [];
}

Namespace.prototype.addChildNamespace = function(namespace) {
	this.namespaces.push(namespace);
	namespace.parent = this;

	return namespace;
};

Namespace.prototype.addType = function(type) {
	this.types.push(type);

	return type;
};

/**
 * Returns an array of the types by the specified type.
 *
 * @method getMembersByType
 * @param {String} type Type name to get members by.
 * @return {Array} Array of members of the type MemberInfo.
 */
Namespace.prototype.getTypesByType = function(typeName) {
	var types = [];

	this.types.forEach(function(type) {
		if (type.data.type == typeName) {
			types.push(type);
		}
	});

	return types;
};

/**
 * Returns an array of classes.
 *
 * @method getClasses
 * @return {Array} Array of classes of the type Type.
 */
Namespace.prototype.getClasses = function() {
	return this.getTypesByType('class');
};

/**
 * Serializes the Namespace as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Namespace.prototype.toJSON = function() {
	var json = {
		fullName: this.fullName,
		summary: this.summary,
		desc: this.desc,
		types: [],
		namespaces: []
	};

	this.types.forEach(function(type) {
		json.types.push(type.toJSON());
	});

	this.namespaces.forEach(function(namespace) {
		json.namespaces.push(namespace.toJSON());
	});

	return this.data;
};

exports.Namespace = Namespace;

