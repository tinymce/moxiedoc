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
	for (var name in data) {
		this[name] = data[name];
	}

	this._types = [];
	this._namespaces = [];
}

Namespace.prototype.addChildNamespace = function(namespace) {
	this._namespaces.push(namespace);
	namespace._parent = this;

	return namespace;
};

Namespace.prototype.getParent = function() {
	return this._parent;
};

Namespace.prototype.getNamespaces = function() {
	return this._namespaces;
};

Namespace.prototype.addType = function(type) {
	this._types.push(type);

	return type;
};

Namespace.prototype.getTypes = function() {
	return this._types;
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

	this._types.forEach(function(type) {
		if (type.type == typeName) {
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
 * Returns an array of mixins.
 *
 * @method getMixins
 * @return {Array} Array of mixins of the type Type.
 */
Namespace.prototype.getMixins = function() {
	return this.getTypesByType('mixin');
};

/**
 * Returns an array of structs.
 *
 * @method getStructs
 * @return {Array} Array of structs of the type Type.
 */
Namespace.prototype.getStructs = function() {
	return this.getTypesByType('struct');
};

/**
 * Serializes the Namespace as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Namespace.prototype.toJSON = function() {
	var json = {
		types: [],
		namespaces: []
	};

	for (var name in this) {
		if (typeof(name) != 'function' && name.indexOf('_') !== 0) {
			json[name] = this[name];
		}
	}

	this._types.forEach(function(type) {
		json.types.push(type.toJSON());
	});

	this._namespaces.forEach(function(namespace) {
		json.namespaces.push(namespace.toJSON());
	});

	return this.data;
};

exports.Namespace = Namespace;

