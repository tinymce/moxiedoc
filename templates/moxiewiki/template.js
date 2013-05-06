var fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");

exports.template = function(root, toPath) {
	function createLink(url) {
		return "wiki://api4:" + url;
	}

	function compileTemplate(filePath) {
		return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
	}

	// Precompile templates
	var constructorTemplate = compileTemplate("constructor.handlebars");
	var callbackTemplate = compileTemplate("callback.handlebars");
	var typeTemplate = compileTemplate("type.handlebars");
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

		var namespaces = root.getNamespaces();
		if (namespaces.length) {
			data.namespaces = [];

			namespaces.forEach(function(namespace) {
				data.namespaces.push({
					fullName: namespace.fullName,
					summary: namespace.summary,
					desc: namespace.desc,
					link: createLink("namespace." + namespace.fullName)
				});
			});
		}

		renderTemplate(indexTemplate, data, "index.html");
	}

	function renderNamespaces() {
		root.getNamespaces().forEach(function(namespace) {
			var data = {
				summary: namespace.summary,
				desc: namespace.desc
			};

			var namespaces = namespace.namespaces;
			if (namespaces.length) {
				data.namespaces = [];

				namespaces.forEach(function(namespace) {
					data.namespaces.push({
						fullName: namespace.fullName,
						desc: namespace.desc,
						summary: namespace.summary,
						link: createLink("namespace." + namespace.fullName)
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
						link: createLink("class." + type.fullName)
					});
				});
			}

			var mixins = namespace.getMixins();
			if (mixins.length) {
				data.mixins = [];

				mixins.forEach(function(type) {
					data.mixins.push({
						fullName: type.fullName,
						summary: type.summary,
						link: createLink("mixin." + type.fullName)
					});
				});
			}

			renderTemplate(namespaceTemplate, data, "namespace." + namespace.fullName + ".html");
		});
	}

	function renderTypes() {
		function renderMembers(type) {
			function addExamples(member, data) {
				if (member.examples) {
					data.examples = [];

					member.examples.forEach(function(example) {
						data.examples.push({
							content: example.content
						});
					});
				}
			}

			function createTypeList(types) {
				var output = [];

				types.forEach(function(fullName) {
					var link, type = root.getTypeByFullName(fullName);

					if (type) {
						link = createLink(type.type + "." + type.fullName);
					}

					output.push({
						name: fullName,
						link: link
					});
				});

				return output;
			}

			function getSyntaxString(member) {
				var params = "", returns = "";

				member.getParams().forEach(function(param) {
					params += (params ? ", " : "") + param.name + ":" + param.types.join('/');
				});

				if (member.data["return"]) {
					returns = member.data["return"].types.join('/');
				}

				switch (member.type) {
					case "callback":
						 return "function " + member.name + "(" + params + "):" + (returns ? returns : 'void');

					case "constructor":
						return "public constructor function " + member.name + "(" + params + "):" + (returns ? returns : 'void');

					case "method":
						return "public function " + member.name + "(" + params + "):" + (returns ? returns : 'void');

					case "event":
						return "public event " + member.name + "(" + params + ")";

					case "property":
						return "public " + member.name + " : " + member.dataType;
				}
			}

			function addParams(member, data) {
				var params = member.getParams();

				if (params.length) {
					data.params = [];
					params.forEach(function(param) {
						data.params.push({
							name: param.name,
							desc: param.data.desc,
							types: createTypeList(param.types)
						});
					});
				}
			}

			type.getConstructors().forEach(function(member) {
				var data = {};

				data.desc = member.data.desc;
				data.syntax = getSyntaxString(member);

				addExamples(member, data);
				addParams(member, data);

				if (member.data["return"]) {
					data["return"] = {
						types: createTypeList(member.data["return"].types),
						desc: member.data["return"].desc
					};
				}

				renderTemplate(constructorTemplate, data, "constructor." + type.fullName + "." + member.name + ".html");
			});

			type.getMethods().forEach(function(member) {
				var data = {};

				data.desc = member.data.desc;
				data.syntax = getSyntaxString(member);

				addExamples(member, data);
				addParams(member, data);

				if (member.data["return"]) {
					data["return"] = {
						types: createTypeList(member.data["return"].types),
						desc: member.data["return"].desc
					};
				}

				renderTemplate(methodTemplate, data, "method." + type.fullName + "." + member.name + ".html");
			});

			type.getEvents().forEach(function(member) {
				var data = {};

				addExamples(member, data);
				addParams(member, data);
				data.syntax = getSyntaxString(member);

				renderTemplate(eventTemplate, data, "event." + type.fullName + "." + member.name + ".html");
			});

			type.getProperties().forEach(function(member) {
				var data = {};

				addExamples(member, data);
				data.types = createTypeList(member.dataTypes);
				data.syntax = getSyntaxString(member);
				data.isStatic = member.isStatic();

				renderTemplate(propertyTemplate, data, "property." + type.fullName + "." + member.name + ".html");
			});
		}

		root.getTypes().forEach(function(type) {
			var data = {};

			data.name = type.name;
			data.desc = type.data.desc;

			var superTypes = type.getSuperTypes();
			if (superTypes.length) {
				data.superTypes = [];

				superTypes.forEach(function(type) {
					data.superTypes.push({
						name: type.name,
						link: createLink(type.type + "." + type.fullName)
					});
				});
			}

			var subTypes = type.getSubTypes();
			if (subTypes.length) {
				data.subTypes = [];

				subTypes.forEach(function(type) {
					data.subTypes.push({
						name: type.name,
						link: createLink(type.type + "." + type.fullName)
					});
				});
			}

			var mixesTypes = type.getMixes();
			if (mixesTypes.length) {
				data.mixesTypes = [];

				mixesTypes.forEach(function(type) {
					data.mixesTypes.push({
						name: type.name,
						link: createLink(type.type + "." + type.fullName)
					});
				});
			}

			var mixinTypes = type.getMixins();
			if (mixinTypes.length) {
				data.mixinTypes = [];

				mixinTypes.forEach(function(type) {
					data.mixinTypes.push({
						name: type.name,
						link: createLink(type.type + "." + type.fullName)
					});
				});
			}

			data.subMixinOrSuperTypes = data.superTypes || data.subTypes || data.mixinTypes;

			function createMembers(members) {
				if (members.length) {
					var output = [];

					members.forEach(function(member) {
						var definedinLink;

						if (member.parentType != type) {
							definedinLink = createLink(member.parentType.type + "." + member.parentType.fullName);
						}

						output.push({
							name: member.name,
							link: createLink(member.type + "." + member.parentType.fullName + "." + member.name),
							summary: member.summary,
							isStatic: member.isStatic(),
							definedin: member.parentType.fullName,
							definedinLink: definedinLink
						});
					});

					return output;
				}
			}

			data.constructors = createMembers(type.getConstructors(true));
			data.methods = createMembers(type.getMethods(true));
			data.events = createMembers(type.getEvents(true));
			data.properties = createMembers(type.getProperties(true));
			data.fields = createMembers(type.getFields(true));

			if (type.examples) {
				data.examples = [];

				type.examples.forEach(function(example) {
					data.examples.push({
						content: example.content
					});
				});
			}

			renderTemplate(typeTemplate, data, type.type + "." + type.fullName + ".html");
			renderMembers(type);
		});
	}

	function generateIndex() {
		var index = [];

		root.rootTypes.forEach(function(type) {
			index.push([
				"index",
				type.type + "." + type.fullName
			]);

			type.getMembers().forEach(function(member) {
				index.push([
					type.type + type.fullName,
					member.type + "." + member.parentType.fullName + "." + member.name
				]);
			});
		});

		root.getNamespaces().forEach(function(namespace) {
			var parentPage = "index";

			if (namespace.parent) {
				parentPage = "namespace." + namespace.parent.fullName;
			}

			index.push([
				parentPage,
				"namespace." + namespace.fullName
			]);

			namespace.getTypes().forEach(function(type) {
				index.push([
					"namespace." + namespace.fullName,
					type.type + "." + type.fullName
				]);

				type.getMembers().forEach(function(member) {
					index.push([
						type.type + "." + type.fullName,
						member.type + "." + member.parentType.fullName + "." + member.name
					]);
				});
			});
		});

		fs.writeFileSync(path.join(toPath, "index.json"), JSON.stringify(index, null, '  '));
	}

	renderIndex();
	renderNamespaces();
	renderTypes();
	generateIndex();
};
