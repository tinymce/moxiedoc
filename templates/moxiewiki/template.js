var fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");

exports.template = function(api, toPath) {
	function compileTemplate(filePath) {
		return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
	}

	// Precompile templates
	var callbackTemplate = compileTemplate("callback.handlebars");
	var classTemplate = compileTemplate("class.handlebars");
	var eventTemplate = compileTemplate("event.handlebars");
	var indexTemplate = compileTemplate("index.handlebars");
	var methodTemplate = compileTemplate("method.handlebars");
	var namespaceTemplate = compileTemplate("namespace.handlebars");
	var propertyTemplate = compileTemplate("property.handlebars");

	function renderTemplate(template, data, toFile) {
		fs.writeFileSync(path.join(toPath, toFile), template(data));
	}

	function renderIndex() {
		var data = {};

		var namespaces = api.getNamespaces();
		if (namespaces.length) {
			data.namespaces = [];

			namespaces.forEach(function(namespace) {
				data.namespaces.push({
					fullName: namespace.fullName,
					desc: namespace.desc,
					link: "namespace." + namespace.fullName + ".html"
				});
			});
		}

		renderTemplate(indexTemplate, data, "index.html");
	}

	function renderNamespaces() {
		api.getNamespaces().forEach(function(namespace) {
			var data = {};

			var namespaces = namespace.namespaces;
			if (namespaces.length) {
				data.namespaces = [];

				namespaces.forEach(function(namespace) {
					data.namespaces.push({
						fullName: namespace.fullName,
						desc: namespace.desc,
						link: "namespace." + namespace.fullName + ".html"
					});
				});
			}

			var classes = namespace.getClasses();
			if (classes.length) {
				data.classes = [];

				classes.forEach(function(type) {
					data.classes.push({
						fullName: type.fullName,
						summary: type.summary,
						link: "class." + type.fullName + ".html"
					});
				});
			}

			renderTemplate(namespaceTemplate, data, "namespace." + namespace.fullName + ".html");
		});
	}

	function renderTypes() {
		function renderMembers(type) {
			type.getMethods().forEach(function(member) {
				renderTemplate(methodTemplate, type, "method." + type.fullName + "." + member.name + ".html");
			});

			type.getEvents().forEach(function(member) {
				renderTemplate(eventTemplate, type, "event." + type.fullName + "." + member.name + ".html");
			});

			type.getProperties().forEach(function(member) {
				renderTemplate(propertyTemplate, type, "property." + type.fullName + "." + member.name + ".html");
			});
		}

		api.getTypes().forEach(function(type) {
			renderTemplate(classTemplate, type, type.type + "." + type.fullName + ".html");
			renderMembers(type);
		});
	}

	renderIndex();
	renderNamespaces();
	renderTypes();
};
