var fs = require('fs');
var XmlWriter = require(__dirname + '/XmlWriter').XmlWriter;

function getNamespace(typeInfo) {
	var namespace = typeInfo.fullName.split('.');
	namespace.pop();
	namespace = namespace.join('.');

	return namespace;
}

function getSortedNameSpaces(types) {
	var namespaces = [];

	types.forEach(function(typeInfo) {
		var namespace = getNamespace(typeInfo);

		if (namespace && namespaces.indexOf(namespace) === -1) {
			namespaces.push(namespace);
		}
	});

	return namespaces.sort();
}

function findTypesByNamespace(types, namespace) {
	var output = [];

	types.forEach(function(typeInfo) {
		if (getNamespace(typeInfo) === namespace) {
			output.push(typeInfo);
		}
	});

	return output;
}

exports.template = function(types, toPath) {
	var writer = new XmlWriter();

	writer.pi('xml version="1.0" encoding="UTF-8" standalone="no"');
	writer.start('model');

	getSortedNameSpaces(types).forEach(function(namespace) {
		writer.start('namespace', {fullname: namespace, name: namespace.split('.').pop()});

		findTypesByNamespace(types, namespace).forEach(function(typeInfo) {
			writer.start('class', {fullname: typeInfo.fullName, name: typeInfo.name, summary: typeInfo.summary});

			if (typeInfo.data.desc) {
				writer.start('description');
				writer.text(typeInfo.data.desc);
				writer.end('description');
			}

			writer.start('members');
			typeInfo.getMembers().forEach(function(memberInfo) {
				writer.start(memberInfo.type, {name: memberInfo.name, summary: memberInfo.summary});
				writer.start('description');
				writer.text(memberInfo.data.desc);
				writer.end('description');

				memberInfo.getParams().forEach(function(paramInfo) {
					writer.start('param', {name: paramInfo.data.name});

					writer.start('description');
					writer.text(paramInfo.data.desc);
					writer.end('description');

					paramInfo.data.types.forEach(function(type) {
						writer.start('type', {fullname: type}, true);
					});

					writer.end('param');
				});

				if (memberInfo.data['return']) {
					writer.start('return');
					writer.start('description');
					writer.text(memberInfo.data['return'].desc);
					writer.end('description');
					memberInfo.data['return'].types.forEach(function(type) {
						writer.start('type', {fullname: type}, true);
					});
					writer.end('return');
				}

				writer.end(memberInfo.type);
			});
			writer.end('members');

			writer.end('class');
		});

		writer.end('namespace');
	});

	writer.end('model');

	console.log(writer.getContent());
};
