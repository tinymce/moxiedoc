var Handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");

function toJSON(array) {
	var out = [];

	array.forEach(function(item) {
		out.push(item.toJSON());
	});

	return out;
}

function renderTemplate(templatePath, data, outputFile) {
	var template = Handlebars.compile(fs.readFileSync(path.join(__dirname, templatePath)).toString());
	fs.writeFileSync(outputFile, template(data));
}

function renderIndex(types, toPath) {
	var index = [];

	types.forEach(function(typeInfo) {
		index.push({fullName: typeInfo.fullName, name: typeInfo.name});
	});

	renderTemplate("index.handlebars", {classes: index}, path.join(toPath, "index.md"));
}

function renderType(typeInfo, toPath) {
	renderTemplate("type.handlebars", {
		fullName: typeInfo.fullName,
		desc: typeInfo.data.desc,

		constructors: toJSON(typeInfo.getConstructors()),
		methods: toJSON(typeInfo.getMethods()),
		events: toJSON(typeInfo.getEvents()),
		properties: toJSON(typeInfo.getProperties()),
		fields: toJSON(typeInfo.getFields())
	}, path.join(toPath, typeInfo.name + ".md"));
}

exports.template = function(types, toPath) {
	renderIndex(types, toPath);

	types.forEach(function(typeInfo) {
		renderType(typeInfo, toPath);
	});
};
