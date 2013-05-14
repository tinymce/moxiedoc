var fs = require("fs");
var path = require("path");
var Handlebars = require("handlebars");
var ZipWriter = require('moxie-zip').ZipWriter;

exports.template = function(root, toPath) {
	var archive = new ZipWriter();

	function createLink(url) {
		return "wiki://api4:" + url;
	}

	function compileTemplate(filePath) {
		return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
	}

	// Precompile templates
	var typeTemplate = compileTemplate("type.handlebars");
	var indexTemplate = compileTemplate("index.handlebars");
	var memberTemplate = compileTemplate("member.handlebars");
	var namespaceTemplate = compileTemplate("namespace.handlebars");

	function renderTemplate(template, data, toFileName) {
		//fs.writeFileSync(path.join(toPath, toFileName), template(data));
		archive.addData(toFileName, template(data));
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

			var namespaces = namespace.getNamespaces();
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

			function createTypeList(types, currentType) {
				var output = [];

				types.forEach(function(fullName) {
					var link, type = root.getTypeByFullName(fullName);

					if (type) {
						link = createLink(type.type + "." + type.fullName);
					}

					if (!link) {
						var member = currentType.getMemberByName(fullName);

						if (member) {
							link = createLink(member.type + "." + currentType.fullName + "." + member.name);
						}
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

				if (member["return"]) {
					returns = member["return"].types.join('/');
				}

				switch (member.type) {
					case "callback":
						 return "function " + member.name + "(" + params + "):" + (returns ? returns : 'void');

					case "constructor":
						return "public constructor function " + type.name + "(" + params + "):" + (returns ? returns : 'void');

					case "method":
						return "public function " + member.name + "(" + params + "):" + (returns ? returns : 'void');

					case "event":
						return "public event " + member.name + "(" + params + ")";

					case "property":
						return "public " + member.name + " : " + member.dataTypes.join('/');

					case "setting":
						return "public " + member.name + " : " + member.dataTypes.join('/');
				}
			}

			function addParams(member, data) {
				var params = member.getParams();

				if (params.length) {
					data.params = [];
					params.forEach(function(param) {
						data.params.push({
							name: param.name,
							desc: param.desc,
							types: createTypeList(param.types, type)
						});
					});
				}
			}

			type.getMembers().forEach(function(member) {
				var data = {};

				data.desc = member.desc;
				data.syntax = getSyntaxString(member);
				data.type = member.type;
				data.isStatic = member.isStatic();

				if (member.dataTypes) {
					data.dataTypes = createTypeList(member.dataTypes, type);
				}

				addExamples(member, data);
				addParams(member, data);

				if (member["return"]) {
					data["return"] = {
						types: createTypeList(member["return"].types, type),
						desc: member["return"].desc
					};
				}

				renderTemplate(memberTemplate, data, data.type + "." + type.fullName + "." + member.name + ".html");
			});
		}

		root.getTypes().forEach(function(type) {
			var data = {};

			data.name = type.name;
			data.desc = type.desc;

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

						if (member.getParentType() != type) {
							definedinLink = createLink(member.getParentType().type + "." + member.getParentType().fullName);
						}

						output.push({
							name: member.name,
							link: createLink(member.type + "." + member.getParentType().fullName + "." + member.name),
							summary: member.summary,
							isStatic: member.isStatic(),
							definedin: member.getParentType().fullName,
							definedinLink: definedinLink
						});
					});

					return output;
				}
			}

			data.constructors = createMembers(type.getConstructors());
			data.settings = createMembers(type.getSettings(true));
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

		root.getRootTypes().forEach(function(type) {
			index.push([
				"index",
				type.type + "." + type.fullName
			]);

			type.getMembers().forEach(function(member) {
				index.push([
					type.type + "." + type.fullName,
					member.type + "." + member.getParentType().fullName + "." + member.name
				]);
			});
		});

		root.getNamespaces().forEach(function(namespace) {
			var parentPage = "index";

			if (namespace.getParent()) {
				parentPage = "namespace." + namespace.getParent().fullName;
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
						member.type + "." + member.getParentType().fullName + "." + member.name
					]);
				});
			});
		});

		//fs.writeFileSync(path.join(toPath, "index.json"), JSON.stringify(index, null, '  '));
		archive.addData("index.json", JSON.stringify(index, null, '  '));
	}

	renderIndex();
	renderNamespaces();
	renderTypes();
	generateIndex();

	archive.saveAs(toPath);
};
