var clc = require('cli-color');

exports.template = function(types) {
	//var types = api.getTypes();

	console.log(JSON.stringify(types, null, ' '));

/*	for (var className in types) {
		var typeInfo = types[className];

		console.log('Class: ' + className);
		typeInfo.getMethods().forEach(function(memberInfo) {
			console.log('Method: ' + memberInfo.name);
		});
	}*/

/*
	for (var typeName in types) {
		var typeInfo = types[typeName];
		var typeLine = '';

		if (typeInfo.access) {
			typeLine += typeInfo.access + ' ';
		}

		if (typeInfo.static) {
			typeLine += 'static ';
		}

		if (typeInfo.abstract) {
			typeLine += 'abstract ';
		}

		if (typeInfo.type) {
			typeLine += typeInfo.type + ' ';
		}

		typeLine += typeName;

		console.log(clc.bold(typeLine));
		console.log(typeInfo.desc);
		console.log('');

		if (types[typeName].methods) {
			console.log(clc.red('Methods'));

			types[typeName].methods.forEach(function(methodInfo) {
				var methodLine = '';

				if (methodInfo.access) {
					methodLine += methodInfo.access + ' ';
				}

				if (methodInfo.static) {
					methodLine += 'static ';
				}

				if (methodInfo.abstract) {
					methodLine += 'abstract ';
				}

				methodLine += methodInfo.name;

				methodLine += '(';

				if (methodInfo.params) {
					var params = '';

					methodInfo.params.forEach(function(paramInfo) {
						if (params) {
							params += ', ';
						}

						if (paramInfo.optional) {
							if ("default" in paramInfo) {
								params += '[' + paramInfo.name + '=' + paramInfo["default"] + ']';
							} else {
								params += '[' + paramInfo.name + ']';
							}
						} else {
							params += paramInfo.name;
						}

						params += ':' + paramInfo.type;
					});

					methodLine += params;
				}

				methodLine += ')';

				if ("return" in methodInfo) {
					methodLine += ':' + methodInfo["return"].type;
				} else {
					methodLine += ':void';
				}

				console.log(clc.bold(methodLine));

				if (methodInfo.params) {
					console.log(clc.bold('Params'));
					methodInfo.params.forEach(function(paramInfo) {
						var paramLine = '';

						if (paramInfo.optional) {
							if ("default" in paramInfo) {
								paramLine += '[' + paramInfo.name + '=' + paramInfo["default"] + '] ';
							} else {
								paramLine += '[' + paramInfo.name + '] ';
							}
						} else {
							paramLine += paramInfo.name + ' ';
						}

						paramLine += '{' + paramInfo.type + '} ';
						paramLine += paramInfo.desc;

						console.log(paramLine);
					});
				}

				console.log('');
			});
		}
	}

	//console.log(clc.red('APA'));
	//console.log(JSON.stringify(api, null, '\t'));
*/
};
