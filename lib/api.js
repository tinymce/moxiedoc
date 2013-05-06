var Namespace = require("./namespace").Namespace;

function Api() {
	this.namespaces = [];
	this.types = [];
	this.rootTypes = [];
	this.rootNamespaces = [];
}

Api.getNamespaceFromFullName = function(fullName) {
	var chunks = fullName.split('.');
	chunks.pop();
	return chunks.join('.');
};

Api.prototype.addNamespace = function(namespace) {
	this.namespaces.push(namespace);
	return namespace;
};

Api.prototype.getNamespace = function(fullName) {
	for (var i = 0; i < this.namespaces.length; i++) {
		var namespace = this.namespaces[i];
		if (namespace.fullName === fullName) {
			return namespace;
		}
	}

	return null;
};

Api.prototype.getTypeByFullName = function(fullName) {
	for (var i = 0; i < this.types.length; i++) {
		if (this.types[i].fullName == fullName) {
			return this.types[i];
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
					self.rootNamespaces.push(newNameSpace);
				}

				self.namespaces.push(newNameSpace);
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
		this.rootTypes.push(type);
	}

	this.types.push(type);
	type.api = this;

	return type;
};

Api.prototype.getTypes = function() {
	return this.types;
};

Api.prototype.getNamespaces = function() {
	return this.namespaces;
};

Api.prototype.getRootNamespaces = function() {
	return this.rootNamespaces;
};

exports.Api = Api;
