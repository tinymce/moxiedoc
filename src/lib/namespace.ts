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
function Namespace(data: Record<string, any>): void {
  for (const name in data) {
    this[name] = data[name];
  }

  this._types = [];
  this._namespaces = [];
}

Namespace.prototype.addChildNamespace = function(namespace: { _parent: any; }) {
  this._namespaces.push(namespace);
  namespace._parent = this;

  return namespace;
};

Namespace.prototype.getParent = function(): string {
  return this._parent;
};

Namespace.prototype.getNamespaces = function(): string {
  return this._namespaces;
};

Namespace.prototype.addType = function(type: string): string {
  this._types.push(type);

  return type;
};

Namespace.prototype.getTypes = function(): string {
  return this._types;
};

/**
 * Returns an array of the types by the specified type.
 *
 * @method getMembersByType
 * @param {String} type Type name to get members by.
 * @return {Array} Array of members of the type MemberInfo.
 */
Namespace.prototype.getTypesByType = function(typeName: string):string[] {
  let types = [];

  this._types.forEach((type: { type: string; }) => {
      if (type.type === typeName) {
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
Namespace.prototype.getClasses = function(): string[] {
  return this.getTypesByType('class');
};

/**
 * Returns an array of mixins.
 *
 * @method getMixins
 * @return {Array} Array of mixins of the type Type.
 */
Namespace.prototype.getMixins = function(): string[] {
  return this.getTypesByType('mixin');
};

/**
 * Returns an array of structs.
 *
 * @method getStructs
 * @return {Array} Array of structs of the type Type.
 */
Namespace.prototype.getStructs = function(): string[] {
  return this.getTypesByType('struct');
};

/**
 * Removes all private types from the namespace.
 *
 * @method removePrivates
 */
Namespace.prototype.removePrivates = function(): string[] | void {
  this._types = this._types.filter(function(type: { access: string; }) {
    return type.access !== 'private';
  });

  this._namespaces = this._namespaces.filter(function(namespace: { removePrivates: () => void; getTypes: () => { (): any; new(): any; length: any; }; getNamespaces: () => { (): any; new(): any; length: number; }; access: string; }) {
    namespace.removePrivates();

    if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
      return false;
    }

    return namespace.access !== 'private';
  });
};

/**
 * Serializes the Namespace as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Namespace.prototype.toJSON = function(): Record<string, any> {
  let json = {
    types: [],
    namespaces: []
  };

  for (const name in this) {
    if (typeof(name) !== 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  this._types.forEach((type: { toJSON: () => string; }) => {
      json.types.push(type.toJSON());
    });

  this._namespaces.forEach((namespace: { toJSON: () => string; }) => {
      json.namespaces.push(namespace.toJSON());
    });

  return this.data;
};

export {
  Namespace
};

