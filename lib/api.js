var Namespace = require('./namespace').Namespace;

function Api() {
  this._namespaces = [];
  this._types = [];
  this._rootTypes = [];
  this._rootNamespaces = [];
}

Api.prototype.getRootTypes = function() {
  return this._rootTypes;
};

Api.getNamespaceFromFullName = function(fullName) {
  var chunks = fullName.split('.');
  chunks.pop();
  return chunks.join('.');
};

Api.prototype.addNamespace = function(namespace) {
  this._namespaces.push(namespace);
  return namespace;
};

Api.prototype.getNamespace = function(fullName) {
  for (var i = 0; i < this._namespaces.length; i++) {
    var namespace = this._namespaces[i];
    if (namespace.fullName === fullName) {
      return namespace;
    }
  }

  return null;
};

Api.prototype.getTypeByFullName = function(fullName) {
  for (var i = 0; i < this._types.length; i++) {
    if (this._types[i].fullName == fullName) {
      return this._types[i];
    }
  }

  return null;
};

Api.prototype.createNamespace = function(fullName, isClass) {
  var self = this, namespaceFullName;

  namespaceFullName = isClass ? Api.getNamespaceFromFullName(fullName) : fullName;

  // Get or create namespace for type
  var namespace = this.getNamespace(namespaceFullName);
  if (!namespace && namespaceFullName) {
    var fullNameChunks = namespaceFullName.split('.');
    namespaceFullName = '';

    fullNameChunks.forEach(function(chunk) {
      if (namespaceFullName) {
        namespaceFullName += '.';
      }

      namespaceFullName += chunk;

      var targetNamespace = self.getNamespace(namespaceFullName);
      if (!targetNamespace) {
        var newNameSpace = new Namespace({fullName: namespaceFullName});
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

Api.prototype.addType = function(type) {
  var existingType = this.getTypeByFullName(type);
  if (existingType) {
    return existingType;
  }

  var namespace = this.createNamespace(type.fullName, true);

  if (namespace) {
    namespace.addType(type);
  } else {
    this._rootTypes.push(type);
  }

  this._types.push(type);
  type._api = this;

  return type;
};

Api.prototype.getTypes = function() {
  return this._types;
};

Api.prototype.getNamespaces = function() {
  return this._namespaces;
};

Api.prototype.getRootNamespaces = function() {
  return this._rootNamespaces;
};

Api.prototype.removePrivates = function() {
  this._types = this._types.filter(function(type) {
    type.removePrivates();

    return type.access != 'private';
  });

  this._namespaces = this._namespaces.filter(function(namespace) {
    namespace.removePrivates();

    if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
      return false;
    }

    return namespace.access != 'private';
  });

  this._rootNamespaces = this._namespaces.filter(function(namespace) {
    namespace.removePrivates();

    if (namespace.getTypes().length + namespace.getNamespaces().length === 0) {
      return false;
    }

    return namespace.access != 'private';
  });
};

/**
 * Serializes the Type as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Api.prototype.toJSON = function() {
  var json = {};

  for (var name in this) {
    if (typeof(this[name]) != 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  json.types = [];
  this._types.forEach(function(type) {
    json.types.push(type.toJSON());
  });

  return json;
};

exports.Api = Api;
