import { Namespace } from './namespace';

function Api() {
  this._namespaces = [];
  this._types = [];
  this._rootTypes = [];
  this._rootNamespaces = [];
}

Api.prototype.getRootTypes = function(): string[] {
  return this._rootTypes;
};

Api.getNamespaceFromFullName = function(fullName: string): string {
  let chunks = fullName.split('.');
  chunks.pop();
  return chunks.join('.');
};

Api.prototype.addNamespace = function(namespace: string): string {
  this._namespaces.push(namespace);
  return namespace;
};

Api.prototype.getNamespace = function(fullName: string): string {
  for (let i = 0; i < this._namespaces.length; i++) {
    const namespace = this._namespaces[i];
    if (namespace.fullName === fullName) {
      return namespace;
    }
  }

  return null;
};

Api.prototype.getTypeByFullName = function(fullName: string): string | null {
  for (let i = 0; i < this._types.length; i++) {
    if (this._types[i].fullName === fullName) {
      return this._types[i];
    }
  }

  return null;
};

Api.prototype.createNamespace = function(fullName: string, isClass: boolean) {
  const self = this;
  let namespaceFullName: string;

  namespaceFullName = isClass ? Api.getNamespaceFromFullName(fullName) : fullName;

  // Get or create namespace for type
  let namespace = this.getNamespace(namespaceFullName);
  if (!namespace && namespaceFullName) {
    const fullNameChunks = namespaceFullName.split('.');
    namespaceFullName = '';

    fullNameChunks.forEach((chunk: string) => {
        if (namespaceFullName) {
          namespaceFullName += '.';
        }

        namespaceFullName += chunk;

        const targetNamespace = self.getNamespace(namespaceFullName);
        if (!targetNamespace) {
          const newNameSpace = new Namespace({ fullName: namespaceFullName });
          if (namespace) {
            namespace.addChildNamespace(newNameSpace);
          } else {
            self._rootNamespaces.push(newNameSpace);
          }

          self._namespaces.push(newNameSpace);
          namespace = newNameSpace;
        } else {
          namespace = targetNamespace;
        }
      });
  }

  return namespace;
};

Api.prototype.addType = function(type: { fullName: string; _api: any; }) {
  const existingType = this.getTypeByFullName(type);
  if (existingType) {
    return existingType;
  }

  const namespace = this.createNamespace(type.fullName, true);

  if (namespace) {
    namespace.addType(type);
  } else {
    this._rootTypes.push(type);
  }

  this._types.push(type);
  type._api = this;

  return type;
};

Api.prototype.getTypes = function(): string[] {
  return this._types;
};

Api.prototype.getNamespaces = function(): string[] {
  return this._namespaces;
};

Api.prototype.getRootNamespaces = function(): string[] {
  return this._rootNamespaces;
};

Api.prototype.removePrivates = function(): any {
  this._types = this._types.filter(function(type: { removePrivates: () => void; access: string; }) {
    type.removePrivates();

    return type.access !== 'private';
  });

  this._namespaces = this._namespaces.filter(function(namespace: { removePrivates: () => void; getTypes: () => { (): any; new(): any; length: number; }; getNamespaces: () => { (): any; new(): any; length: number; }; access: string; }) {
    namespace.removePrivates();

    if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
      return false;
    }

    return namespace.access !== 'private';
  });

  this._rootNamespaces = this._namespaces.filter(function(namespace: { removePrivates: () => void; getTypes: () => { (): any; new(): any; length: number; }; getNamespaces: () => { (): any; new(): any; length: number; }; access: string; }) {
    namespace.removePrivates();

    if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
      return false;
    }

    return namespace.access !== 'private';
  });
};

/**
 * Serializes the Type as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Api.prototype.toJSON = function(): Record<string, any> {
  let json: Record<string, any> = {};

  for (const name in this) {
    if (typeof(this[name]) !== 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  json.types = [];
  this._types.forEach((type: { toJSON: () => any; }) => {
      json.types.push(type.toJSON());
    });

  return json;
};

export {
  Api
};
