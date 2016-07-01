/* jshint latedef:true */

var fs = require('fs');
var Handlebars = require('handlebars');
var path = require('path');
var ZipWriter = require('moxie-zip').ZipWriter;
var mkdirp = require('mkdirp').sync;
var YAML = require('js-yaml')
var BASE_PATH = process.env.BASE_PATH || '/api/';

/**
 * [function description]
 * @param  {[type]} root   [description]
 * @param  {[type]} toPath [description]
 * @return {[type]}        [description]
 */
exports.template = function (root, toPath) {
	var archive = new ZipWriter();
	var rootTemplate = compileTemplate('root.handlebars');
	var namespaceTemplate = compileTemplate('namespace.handlebars');
	var template = compileTemplate('member.handlebars');

	// bind new archive to function
	addPageToArchive = addPageToArchive.bind(archive); // jshint ignore:line

	// sort types alphabetically
	var sortedTypes = root.getTypes().sort(function (a, b) {
		if (a.fullName < b.fullName) return -1;
  	if (a.fullName > b.fullName) return 1;
  	return 0;
	});

	addPageToArchive({
		filename: '_data/nav_api.yml',
		content: YAML.safeDump(getNavFile(sortedTypes))
	});

	// create all yml and md for each item
	var pages = sortedTypes.map(getMemberPages.bind(null, root, template))
	flatten(pages).forEach(addPageToArchive);

	getNamespacesFromTypes(sortedTypes).map(function (namespace) {
		var fileName = ('api/' + namespace + '/index.html').toLowerCase();

		return {
			filename: fileName,
			content: namespaceTemplate({
				title: namespace,
				desc: namespace
			})
		};
	}).forEach(addPageToArchive);

	addPageToArchive({
		filename: 'api/index.html',
		content: rootTemplate({})
	});

	archive.saveAs(toPath);
};

function getNamespaceFromFullName(fullName) {
	return fullName.split('.').slice(0, -1).join('.');
}

function getNamespacesFromTypes(types) {
	var namespaces = [];

	var namespaces = types.reduce(function (namespaces, type) {
		var fullName = type.fullName.toLowerCase();
		var namespace = getNamespaceFromFullName(fullName);
		return namespace && namespaces.indexOf(namespace) === -1 ? namespaces.concat(namespace) : namespaces;
	}, []);

	return namespaces;
}

/**
 * [getNavFile description]
 * @return {[type]} [description]
 */
function getNavFile(types) {
	var namespaces = getNamespacesFromTypes(types);
	var pages = namespaces.map(function (namespace) {
		var innerPages = types.filter(function (type) {
			var fullName = type.fullName.toLowerCase();
			return getNamespaceFromFullName(fullName) === namespace;
		}).map(function (type) {
			return { url: type.fullName.toLowerCase() };
		});

		if (namespace === 'tinymce') {
			innerPages.unshift({
				url: 'root_tinymce'
			});
		}

		return {
			url: namespace,
			pages: innerPages
		};
	});

	return [{
		url: 'api',
		pages: pages
	}];
}

/**
 * [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function getMemberPages(root, template, data) {
	var members = data.getMembers(true);
	data = data.toJSON()
	data.datapath = data.type + '_' + data.fullName.replace(/\./g, '_').toLowerCase();
	data.desc = data.desc.replace(/\n/g, ' ');

	data.constructors = []
	data.methods = []
	data.properties = []
	data.settings = []
	data.events = []
	data.keywords = []
	data.borrows = data.borrows || []
	data.examples = data.examples || []

	var parents = [data].concat(data.borrows.map(function (parentName) {
		return root.getTypes().find(function (type) {
			return type.fullName === parentName
		}).toJSON()
	}))

	members.forEach(function (member) {
		var parentType = member.getParentType();

		member = member.toJSON();
		data.keywords.push(member.name);
		member.definedBy = parentType.fullName

		if ('property' === member.type) {
			data.properties.push(member);
			return;
		}

		if ('setting' === member.type) {
			data.settings.push(member);
			return;
		}

		if ('constructor' === member.type) {
			data.constructors.push(member);
			member.signature = getSyntaxString(member);
			return;
		}

		if ('method' === member.type) {
			data.methods.push(member);
			member.signature = getSyntaxString(member);
			return;
		}

		if ('event' === member.type) {
			data.events.push(member);
			return;
		}
	});

	data.constructors = sortMembers(data.constructors)
	data.methods = sortMembers(data.methods)
	data.properties = sortMembers(data.properties)
	data.settings = sortMembers(data.settings)
	data.events = sortMembers(data.events)
	data.keywords = sortMembers(data.keywords)

	data.keywords = data.keywords.join(' ')

	return [{
		filename: createFileName(data, 'json'),
		content: JSON.stringify(data, null, '  ')
	}, {
		filename: createFileName(data, 'md'),
		content: template(data)
	}];
}

/**
 * [sortMembers description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
function sortMembers(list) {
	return list.sort(function (a, b) {
		if (a.name < b.name) return -1;
  	if (a.name > b.name) return 1;
  	return 0;
	});
}

/**
 * [flatten description]
 * @param  {[type]} array [description]
 * @return {[type]}       [description]
 */
function flatten(array) {
	return [].concat.apply([], array);
}

/**
 * [compileTemplate description]
 * @param  {[type]} filePath [description]
 * @return {[type]}          [description]
 */
function compileTemplate(filePath) {
	return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
}

/**
 * [createFileName description]
 * @param  {[type]} fullName [description]
 * @return {[type]}          [description]
 */
function createFileName(data, ext) {
	if ('md' === ext) {
		var namespace = getNamespaceFromFullName(data.fullName);

		if (!namespace) {
			namespace = 'tinymce';
		}

		if (data.fullName === 'tinymce') {
			return ('api/tinymce/root_tinymce.html').toLowerCase();
		}

		return ('api/' + namespace + '/' + data.fullName + '.html').toLowerCase();
	} else if ('json' === ext) {
		return ('_data/api/' + data.type + '_' + data.fullName.replace(/\./g, '_') + '.json').toLowerCase();
	}
}

/**
 * [addPageToArchive description]
 * @param {[type]} page [description]
 */
function addPageToArchive(page) {
	this.addData(page.filename, page.content);
}

/**
 * [getSyntaxString description]
 * @param  {[type]} member [description]
 * @return {[type]}        [description]
 */
function getSyntaxString(member) {
	var params = member.params.map(function (param) {
		return param.name + ':' + param.types[0]
	}).join(', ')

	var returnType = member.return ? (':' + member.return.types.join(', ')) : '';

	switch (member.type) {
		case 'callback':
			return 'function ' + member.name + '(' + params + ')' + returnType;

		case 'constructor':
			return 'public constructor function ' + member.name + '(' + params + ')' + returnType;

		case 'method':
			return '' + member.name + '(' + params + ')' + returnType;

		case 'event':
			return 'public event ' + member.name + '(' + params + ')';

		case 'property':
			return 'public ' + member.name + ' : ' + member.dataTypes.join('/');

		case 'setting':
			return 'public ' + member.name + ' : ' + member.dataTypes.join('/');
	}
}
