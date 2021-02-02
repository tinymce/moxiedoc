import { Api } from './api';
import { Member } from './member';
import * as Reporter from './reporter';

function sortMembersByName(members: Member[]): Member[] {
  return members.sort((a, b) => {
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
class Type {
  public _allMembers: Member[];
  public _api: Api;
  public _members: Member[] = [];
  public _mixes: string[] = [];
  public _mixesTypes: Type[];
  public _mixinsTypes: Type[];
  public access: string;
  public borrows: any[];
  public fullName: string;
  public name: string;
  public static: boolean;
  public type: string;

  /**
   * Constructs a new Type instance.
   *
   * @constructor
   * @param {Object} data Json structure with type data.
   */
  constructor(data: { name?: string; fullName: string; [ x: string ]: string; }) {
    for (const name in data) {
      this[name] = data[name];
    }

    this.name = data.name = data.name || data.fullName.split('.').pop();
  }

  /**
   * Adds a new member to the type.
   *
   * @method addMember
   * @param {Member} member Member instance to add to type.
   * @return {Member} Member info instance that was passed in.
   */
  public addMember(member: Member): {} {
    member._parentType = this;
    this._members.push(member);

    if (this.static) {
      member.static = true;
    }

    return member;
  };

  public getMembers(includeInherited: boolean = false): Member[] {
    const self = this;

    if (this.borrows) {
      this.borrows.forEach((typeFullName: string) => {
        const type = self._api.getTypeByFullName(typeFullName);

        if (type) {
          type.getMembers(true).forEach((member) => {
            self.addMember(member.clone());
          });
        } else {
          Reporter.warn('Could not borrow members from non existing type:', typeFullName);
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

      types.forEach((type) => {
        type.getMixes().forEach((mixType) => {
          mixType.getMembers().forEach((member) => {
            member = member.clone();

            if (type.static) {
              member.staticLink = member.static;
              member.static = true;
            }

            members[ member.mixType + '.' + member.name + (member.static ? '.static' : '') ] = member;
          });
        });

        type.getMembers().forEach((member) => {
          member.staticLink = member.static;
          members[ member.type + '.' + member.name + (member.static ? '.static' : '') ] = member;
        });
      });

      for (const name in members) {
        output.push(members[ name ]);
      }

      this._allMembers = sortMembersByName(output);

      return output;
    }

    return this._members;
  };

  public getMixes(): Type[] {
    const self = this, api = this._api;
    let output: Type[] = [];

    if (this._mixesTypes) {
      return this._mixesTypes;
    }

    this._mixes.forEach((typeFullName) => {
      const type = api.getTypeByFullName(typeFullName);

      if (type) {
        output.push(type);
      } else {
        Reporter.warn('Could not mixin members into: ' + self.fullName + ' from non existing type:', typeFullName);
      }
    });

    this._mixesTypes = output;

    return output;
  };

  public getMixins() {
    const fullName = this.fullName;
    let mixins = [];

    if (this._mixinsTypes) {
      return this._mixinsTypes;
    }

    if (this.type === 'mixin') {
      this._api.getTypes().forEach((type) => {
        type._mixes.forEach((typeFullName) => {
          if (typeFullName === fullName) {
            mixins.push(type);
          }
        });
      });
    }

    this._mixinsTypes = mixins;

    return mixins;
  };

  public addMixin(mixin: string): string {
    this._mixes.push(mixin);
    return mixin;
  };

  public getSubTypes(): string[] {
    const fullName = this.fullName;
    let subTypes = [];

    this._api.getTypes().forEach((type: Record<string, any>) => {
      if (type[ 'extends' ] === fullName) {
        subTypes.push(type);
      }
    });

    return subTypes;
  };

  public getSuperTypes(): Type[] {
    const superTypes: Type[] = [];
    let type: Type = this;

    while (type) {
      type = this._api.getTypeByFullName(type[ 'extends' ]);

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
  public getMembersByType(type: string, includeInherited?: boolean): Member[] {
    const members: Member[] = [];

    this.getMembers(includeInherited).forEach((member) => {
      if (member.type === type) {
        members.push(member);
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
  public getConstructors(includeInherited?: boolean): Member[] {
    return this.getMembersByType('constructor', includeInherited);
  };

  /**
   * Returns an array of methods.
   *
   * @method getMethods
   * @return {Array} Array of methods of the type Member.
   */
  public getMethods(includeInherited?: boolean): Member[] {
    return this.getMembersByType('method', includeInherited);
  };

  /**
   * Returns an array of properties.
   *
   * @method getProperties
   * @return {Array} Array of properties of the type Member.
   */
  public getProperties(includeInherited?: boolean): Member[] {
    return this.getMembersByType('property', includeInherited);
  };

  /**
   * Returns an array of events.
   *
   * @method getProperties
   * @return {Array} Array of events of the type Member.
   */
  public getEvents(includeInherited?: boolean): Member[] {
    return this.getMembersByType('event', includeInherited);
  };

  /**
   * Returns an array of fields.
   *
   * @method getFields
   * @return {Array} Array of fields of the type Member.
   */
  public getFields(includeInherited?: boolean): Member[] {
    return this.getMembersByType('field', includeInherited);
  };

  /**
   * Returns an array of settings.
   *
   * @method getSettings
   * @return {Array} Array of settings of the type Member.
   */
  public getSettings(includeInherited?: boolean): Member[] {
    return this.getMembersByType('setting', includeInherited);
  };

  /**
   * Returns an array of callbacks.
   *
   * @method getCallbacks
   * @return {Array} Array of callbacks of the type Member.
   */
  public getCallbacks(includeInherited?: boolean): Member[] {
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
  public getMemberByName(name: string, includeInherited?: boolean): Member | null {
    const members = this.getMembers(includeInherited);

    for (let i = 0; i < members.length; i++) {
      if (members[ i ].name === name) {
        return members[ i ];
      }
    }

    return null;
  };

  /**
   * Removes all private members from the type.
   *
   * @method removePrivates
   */
  public removePrivates(): void {
    this._members = this._members.filter(function (member) {
      return member.access !== 'private';
    });
  };

  /**
   * Serializes the Type as JSON.
   *
   * @method toJSON
   * @return {Object} JSON object.
   */
  public toJSON(): Record<string, any> {
    let json: Record<string, any> = {};

    for (const name in this) {
      if (typeof (this[name]) !== 'function' && name.indexOf('_') !== 0) {
        json[name] = this[name];
      }
    }

    json.members = [];
    this._members.forEach((member) => {
      json.members.push(member.toJSON());
    });

    return json;
  };
}

export {
  Type
};
