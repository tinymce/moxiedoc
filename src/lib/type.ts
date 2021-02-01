import * as reporter from './reporter';

function sortMembersByName(members: Record<string, any>): string[]{
  return members.sort(function(a: { name: string; }, b: { name: string; }): number {
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
function Type(data: { name?: string; fullName: string; [x: string]: string; }): void {
  for (const name in data) {
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
Type.prototype.addMember = function(member: { _parentType: any; static: boolean; }): {} {
  member._parentType = this;
  this._members.push(member);

  if (this.static) {
    member.static = true;
  }

  return member;
};

Type.prototype.getMembers = function(includeInherited: string[]) {
  const self = this;

  if (this.borrows) {
    this.borrows.forEach((typeFullName: string) => {
        const type = self._api.getTypeByFullName(typeFullName);

        if (type) {
          type.getMembers(true).forEach((member: { clone: () => any; }) => {
              self.addMember(member.clone());
            });
        } else {
          reporter.warn('Could not borrow members from non existing type:', typeFullName);
        }
      });

    this.borrows = null;
  }

  if (includeInherited) {
    if (this._allMembers) {
      return this._allMembers;
    }

    let members = {}, output = [];
    const types = this.getSuperTypes().reverse();

    types.push(this);

    types.forEach((type: { getMixes: () => any[]; static: boolean; getMembers: () => any[]; }): void => {
        type.getMixes().forEach((mixType: { getMembers: () => any[]; }) => {
            mixType.getMembers().forEach((member: { clone: () => any; staticLink: any; static: boolean; mixType: string; name: string; }) => {
                member = member.clone();

                if (type.static) {
                  member.staticLink = member.static;
                  member.static = true;
                }

                members[member.mixType + '.' + member.name + (member.static ? '.static' : '')] = member;
              });
          });

        type.getMembers().forEach((member: { staticLink: any; static: boolean; type: string; name: string; }) => {
            member.staticLink = member.static;
            members[member.type + '.' + member.name + (member.static ? '.static' : '')] = member;
          });
      });

    for (const name in members) {
      output.push(members[name]);
    }

    this._allMembers = sortMembersByName(output);

    return output;
  }

  return this._members;
};

Type.prototype.getMixes = function() {
  const self = this, api = this._api;
  let output = [];

  if (this._mixesTypes) {
    return this._mixesTypes;
  }

  this._mixes.forEach((typeFullName: string) => {
      const type = api.getTypeByFullName(typeFullName);

      if (type) {
        output.push(type);
      } else {
        reporter.warn('Could not mixin members into: ' + self.fullName + ' from non existing type:', typeFullName);
      }
    });

  this._mixesTypes = output;

  return output;
};

Type.prototype.getMixins = function() {
  const fullName = this.fullName;
  let mixins = [];

  if (this._mixinsTypes) {
    return this._mixinsTypes;
  }

  if (this.type === 'mixin') {
    this._api.getTypes().forEach((type: { _mixes: string[]; }) => {
        type._mixes.forEach((typeFullName: string) => {
            if (typeFullName === fullName) {
              mixins.push(type);
            }
          });
      });
  }

  this._mixinsTypes = mixins;

  return mixins;
};

Type.prototype.addMixin = function(mixin: string) {
  this._mixes.push(mixin);
  return mixin;
};

Type.prototype.getSubTypes = function(): string[] {
  const fullName = this.fullName
  let subTypes = [];

  this._api.getTypes().forEach((type: Record<string, any>) => {
      if (type['extends'] === fullName) {
        subTypes.push(type);
      }
    });

  return subTypes;
};

Type.prototype.getSuperTypes = function(): string[] {
  let superTypes = [], type = this;

  while (type) {
    type = this._api.getTypeByFullName(type['extends']);

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
Type.prototype.getMembersByType = function(type: string, includeInherited: string[]): string[] {
  let members = [];

  this.getMembers(includeInherited).forEach((Member: { type: string; }) => {
      if (Member.type === type) {
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
Type.prototype.getConstructors = function(includeInherited: string[]): string[] {
  return this.getMembersByType('constructor', includeInherited);
};

/**
 * Returns an array of methods.
 *
 * @method getMethods
 * @return {Array} Array of methods of the type Member.
 */
Type.prototype.getMethods = function(includeInherited: string[]): string[] {
  return this.getMembersByType('method', includeInherited);
};

/**
 * Returns an array of properties.
 *
 * @method getProperties
 * @return {Array} Array of properties of the type Member.
 */
Type.prototype.getProperties = function(includeInherited: string[]): string[] {
  return this.getMembersByType('property', includeInherited);
};

/**
 * Returns an array of events.
 *
 * @method getProperties
 * @return {Array} Array of events of the type Member.
 */
Type.prototype.getEvents = function(includeInherited: string[]):string[] {
  return this.getMembersByType('event', includeInherited);
};

/**
 * Returns an array of fields.
 *
 * @method getFields
 * @return {Array} Array of fields of the type Member.
 */
Type.prototype.getFields = function(includeInherited: string[]): string[] {
  return this.getMembersByType('field', includeInherited);
};

/**
 * Returns an array of settings.
 *
 * @method getSettings
 * @return {Array} Array of settings of the type Member.
 */
Type.prototype.getSettings = function(includeInherited: string[]): string[] {
  return this.getMembersByType('setting', includeInherited);
};

/**
 * Returns an array of callbacks.
 *
 * @method getCallbacks
 * @return {Array} Array of callbacks of the type Member.
 */
Type.prototype.getCallbacks = function(includeInherited: string[]): string[] {
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
Type.prototype.getMemberByName = function(name: string, includeInherited: string[]): null {
  const members = this.getMembers(includeInherited);

  for (let i = 0; i < members.length; i++) {
    if (members[i].name === name) {
      return members[i];
    }
  }

  return null;
};

/**
 * Removes all private members from the type.
 *
 * @method removePrivates
 */
Type.prototype.removePrivates = function(): string[] | void {
  this._members = this._members.filter(function(member: { access: string; }) {
    return member.access !== 'private';
  });
};

/**
 * Serializes the Type as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Type.prototype.toJSON = function(): Record<string, any> {
  let json: Record<string, any> = {};

  for ( const name in this) {
    if (typeof(this[name]) !== 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  json.members = [];
  this._members.forEach((member: { toJSON: () => any; }) => {
      json.members.push(member.toJSON());
    });

  return json;
};

export {
  Type
};
