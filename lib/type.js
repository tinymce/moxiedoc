var reporter = require('./reporter');

function sortMembersByName(members) {
	return members.sort(function(a, b) {
		if (a.name < b.name) {
			return -1;
		}

		if (a.name > b.name) {
			return 1;
		}

		return 0;
	});
}

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
	for (var name in data) {
		this[name] = data[name];
	}

	this.name = data.name = data.name || data.fullName.split('.').pop();

	this._members = [];
	this._mixes = [];
}

/**
 * Adds a new member to the type.
 *
 * @method addMember
 * @param {Member} member Member instance to add to type.
 * @return {Member} Member info instance that was passed in.
 */
Type.prototype.addMember = function(member) {
	member._parentType = this;
	this._members.push(member);

	if (this.static) {
		member.static = true;
	}

	return member;
};

Type.prototype.getMembers = function(includeInherited) {
	var self = this;

	if (this.borrows) {
		this.borrows.forEach(function(typeFullName) {
			var type = self._api.getTypeByFullName(typeFullName);

			if (type) {
				type.getMembers(true).forEach(function(member) {
					self.addMember(member.clone());
				});
			} else {
				reporter.warn("Could not borrow members from non existing type:", typeFullName);
			}
		});

		this.borrows = null;
	}

	if (includeInherited) {
		if (this._allMembers) {
			return this._allMembers;
		}

		var members = {}, output = [];
		var types = this.getSuperTypes().reverse();

		types.push(this);

		types.forEach(function(type) {
			type.getMixes().forEach(function(mixType) {
				mixType.getMembers().forEach(function(member) {
					if (type.static) {
						member.static = true;
					}

					members[member.mixType + "." + member.name] = member;
				});
			});

			type.getMembers().forEach(function(member) {
				members[member.type + "." + member.name] = member;
			});
		});

		for (var name in members) {
			output.push(members[name]);
		}

		this._allMembers = sortMembersByName(output);

		return output;
	}

	return this._members;
};

Type.prototype.getMixes = function() {
	var self = this, api = this._api, output = [];

	if (this._mixesTypes) {
		return this._mixesTypes;
	}

	this._mixes.forEach(function(typeFullName) {
		var type = api.getTypeByFullName(typeFullName);

		if (type) {
			output.push(type);
		} else {
			reporter.warn("Could not mixin members into: " + self.fullName + " from non existing type:", typeFullName);
		}
	});

	this._mixesTypes = output;

	return output;
};

Type.prototype.getMixins = function() {
	var fullName = this.fullName, mixins = [];

	if (this._mixinsTypes) {
		return this._mixinsTypes;
	}

	if (this.type == "mixin") {
		this._api.getTypes().forEach(function(type) {
			type._mixes.forEach(function(typeFullName) {
				if (typeFullName == fullName) {
					mixins.push(type);
				}
			});
		});
	}

	this._mixinsTypes = mixins;

	return mixins;
};

Type.prototype.addMixin = function(mixin) {
	this._mixes.push(mixin);
	return mixin;
};

Type.prototype.getSubTypes = function() {
	var fullName = this.fullName, subTypes = [];

	this._api.getTypes().forEach(function(type) {
		if (type["extends"] == fullName) {
			subTypes.push(type);
		}
	});

	return subTypes;
};

Type.prototype.getSuperTypes = function() {
	var superTypes = [], type = this;

	while (type) {
		type = this._api.getTypeByFullName(type["extends"]);

		if (type) {
			superTypes.push(type);
		}
	}

	return superTypes;
};

/**
 * Returns an array of the members by the specified type.
 *
 * @method getMembersByType
 * @param {String} type Type name to get members by.
 * @return {Array} Array of members of the type Member.
 */
Type.prototype.getMembersByType = function(type, includeInherited) {
	var members = [];

	this.getMembers(includeInherited).forEach(function(Member) {
		if (Member.type == type) {
			members.push(Member);
		}
	});

	return members;
};

/**
 * Returns an array of constructors some languages might have multiple due to overloading.
 *
 * @method getConstructors
 * @return {Array} Array of constructors of the type Member.
 */
Type.prototype.getConstructors = function(includeInherited) {
	return this.getMembersByType('constructor', includeInherited);
};

/**
 * Returns an array of methods.
 *
 * @method getMethods
 * @return {Array} Array of methods of the type Member.
 */
Type.prototype.getMethods = function(includeInherited) {
	return this.getMembersByType('method', includeInherited);
};

/**
 * Returns an array of properties.
 *
 * @method getProperties
 * @return {Array} Array of properties of the type Member.
 */
Type.prototype.getProperties = function(includeInherited) {
	return this.getMembersByType('property', includeInherited);
};

/**
 * Returns an array of events.
 *
 * @method getProperties
 * @return {Array} Array of events of the type Member.
 */
Type.prototype.getEvents = function(includeInherited) {
	return this.getMembersByType('event', includeInherited);
};

/**
 * Returns an array of fields.
 *
 * @method getFields
 * @return {Array} Array of fields of the type Member.
 */
Type.prototype.getFields = function(includeInherited) {
	return this.getMembersByType('field', includeInherited);
};

/**
 * Returns an array of settings.
 *
 * @method getSettings
 * @return {Array} Array of settings of the type Member.
 */
Type.prototype.getSettings = function(includeInherited) {
	return this.getMembersByType('setting', includeInherited);
};

/**
 * Returns an array of callbacks.
 *
 * @method getCallbacks
 * @return {Array} Array of callbacks of the type Member.
 */
Type.prototype.getCallbacks = function(includeInherited) {
	return this.getMembersByType('callback', includeInherited);
};

/**
 * Returns a member by name.
 *
 * @method getMemberByName
 * @param {String} name Name of the member to retrive.
 * @param {Boolean} [includeInherited] Include inherited members.
 * @return {moxiedoc.Member} Member instance or null.
 */
Type.prototype.getMemberByName = function(name, includeInherited) {
	var members = this.getMembers(includeInherited);

	for (var i = 0; i < members.length; i++) {
		if (members[i].name == name) {
			return members[i];
		}
	}

	return null;
};

/**
 * Serializes the Type as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Type.prototype.toJSON = function() {
	var json = {};

	for (var name in this) {
		if (typeof(this[name]) != 'function' && name.indexOf('_') !== 0) {
			json[name] = this[name];
		}
	}

	json.members = [];
	this._members.forEach(function(member) {
		json.members.push(member.toJSON());
	});

	return json;
};

exports.Type = Type;
