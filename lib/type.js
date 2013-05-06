/**
 * Type class contains details about classes, enums, structs etc.
 *
 * @class moxiedoc.Type
 */

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
	this.static = data.static;

	this.members = [];
	this.mixes = [];
}

/**
 * Adds a new member to the type.
 *
 * @method addMember
 * @param {MemberInfo} member MemberInfo instance to add to type.
 * @return {MemberInfo} Member info instance that was passed in.
 */
Type.prototype.addMember = function(member) {
	member.parentType = this;
	this.members.push(member);

	if (this.static || this.data.static) {
		member.data.static = true;
	}

	return member;
};

Type.prototype.getMembers = function(includeInherited) {
	var self = this;

	if (this.borrows) {
		this.borrows.forEach(function(typeFullName) {
			var type = self.api.getTypeByFullName(typeFullName);

			if (type) {
				type.getMembers().forEach(function(member) {
					self.addMember(member.clone());
				});
			} else {
				console.log('Warn:', typeFullName);
			}
		});

		this.borrows = null;
	}

	if (includeInherited) {
		if (this.allMembers) {
			return this.allMembers;
		}

		var members = {}, output = [];
		var types = this.getSuperTypes().reverse();

		types.push(this);

		types.forEach(function(type) {
			type.getMixes().forEach(function(type) {
				type.getMembers().forEach(function(member) {
					members[member.name] = member;
				});
			});

			type.getMembers().forEach(function(member) {
				members[member.name] = member;
			});
		});

		for (var name in members) {
			output.push(members[name]);
		}

		this.allMembers = sortMembersByName(output);

		return output;
	}

	return this.members;
};

Type.prototype.getMixes = function() {
	var api = this.api, output = [];

	this.mixes.forEach(function(typeFullName) {
		var type = api.getTypeByFullName(typeFullName);

		if (type) {
			output.push(type);
		} else {
			console.log('Warn: ' + typeFullName);
		}
	});

	return output;
};

Type.prototype.getMixins = function() {
	var fullName = this.fullName, mixins = [];

	if (this.type == "mixin") {
		this.api.getTypes().forEach(function(type) {
			type.mixes.forEach(function(typeFullName) {
				if (typeFullName == fullName) {
					mixins.push(type);
				}
			});
		});
	}

	return mixins;
};

Type.prototype.getSubTypes = function() {
	var fullName = this.fullName, subTypes = [];

	this.api.getTypes().forEach(function(type) {
		if (type.data["extends"] == fullName) {
			subTypes.push(type);
		}
	});

	return subTypes;
};

Type.prototype.getSuperTypes = function() {
	var superTypes = [], type = this;

	while (type) {
		type = this.api.getTypeByFullName(type.data["extends"]);

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
 * @return {Array} Array of members of the type MemberInfo.
 */
Type.prototype.getMembersByType = function(type, includeInherited) {
	var members = [];

	this.getMembers(includeInherited).forEach(function(memberInfo) {
		if (memberInfo.type == type) {
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
Type.prototype.getConstructors = function(includeInherited) {
	return this.getMembersByType('constructor', includeInherited);
};

/**
 * Returns an array of methods.
 *
 * @method getMethods
 * @return {Array} Array of methods of the type MemberInfo.
 */
Type.prototype.getMethods = function(includeInherited) {
	return this.getMembersByType('method', includeInherited);
};

/**
 * Returns an array of properties.
 *
 * @method getProperties
 * @return {Array} Array of properties of the type MemberInfo.
 */
Type.prototype.getProperties = function(includeInherited) {
	return this.getMembersByType('property', includeInherited);
};

/**
 * Returns an array of events.
 *
 * @method getProperties
 * @return {Array} Array of events of the type MemberInfo.
 */
Type.prototype.getEvents = function(includeInherited) {
	return this.getMembersByType('event', includeInherited);
};

/**
 * Returns an array of fields.
 *
 * @method getFields
 * @return {Array} Array of fields of the type MemberInfo.
 */
Type.prototype.getFields = function(includeInherited) {
	return this.getMembersByType('field', includeInherited);
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
