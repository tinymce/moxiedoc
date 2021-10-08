import { Namespace } from './namespace';
import { Type } from './type';

class Api {
  public _namespaces: Namespace[] = [];
  public _types: Type[] = [];
  public _rootTypes: Type[] = [];
  public _rootNamespaces: Namespace[] = [];

  public static getNamespaceFromFullName(fullName: string): string {
    const chunks = fullName.split('.');
    chunks.pop();
    return chunks.join('.');
  }

  public getRootTypes(): Type[] {
    return this._rootTypes;
  }

  public addNamespace(namespace: Namespace): Namespace {
    this._namespaces.push(namespace);
    return namespace;
  }

  public getNamespace(fullName: string): Namespace | null {
    for (const namespace of this._namespaces) {
      if (namespace.fullName === fullName) {
        return namespace;
      }
    }

    return null;
  }

  public getTypeByFullName(fullName: string): Type | null {
    for (const item of this._types) {
      if (item.fullName === fullName) {
        return item;
      }
    }

    return null;
  }

  public createNamespace(fullName: string, isClass: boolean = false): Namespace {
    const self = this;
    let namespaceFullName: string;

    namespaceFullName = isClass ? Api.getNamespaceFromFullName(fullName) : fullName;

    // Get or create namespace for type
    let namespace = self.getNamespace(namespaceFullName);
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
  }

  public addType(type: Type | string): Type | undefined {
    if (typeof type === 'string') {
      const existingType = this.getTypeByFullName(type);
      if (existingType) {
        return existingType;
      }
    } else {
      const namespace = this.createNamespace(type.fullName, true);

      if (namespace) {
        namespace.addType(type);
      } else {
        this._rootTypes.push(type);
      }

      this._types.push(type);
      type._api = this;

      return type;
    }
  }

  public getTypes(): Type[] {
    return this._types;
  }

  public getNamespaces(): Namespace[] {
    return this._namespaces;
  }

  public getRootNamespaces(): Namespace[] {
    return this._rootNamespaces;
  }

  public removePrivates(): void {
    this._types = this._types.filter((type) => {
      type.removePrivates();

      return type.access !== 'private';
    });

    this._namespaces = this._namespaces.filter((namespace) => {
      namespace.removePrivates();

      if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
        return false;
      }

      return namespace.access !== 'private';
    });

    this._rootNamespaces = this._namespaces.filter((namespace) => {
      namespace.removePrivates();

      if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
        return false;
      }

      return namespace.access !== 'private';
    });
  }

  /**
   * Serializes the Type as JSON.
   *
   * @method toJSON
   * @return {Object} JSON object.
   */
  public toJSON(): Record<string, any> {
    const json: Record<string, any> = {};

    for (const name in this) {
      if (typeof (this[name]) !== 'function' && name.indexOf('_') !== 0) {
        json[name] = this[name];
      }
    }

    json.types = [];
    this._types.forEach((type) => {
      json.types.push(type.toJSON());
    });

    return json;
  }
}

export {
  Api
};
