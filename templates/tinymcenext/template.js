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

	archive.saveAs(toPath);
};

/**
 * [getNavFile description]
 * @return {[type]} [description]
 */
function getNavFile(types) {
	var nav = [{
		url: "api",
		pages: [{
			"url": "class",
			"pages": []
		}, {
			"url": "mixin",
			"pages": []
		}]
	}];

	nav[0].pages[0].pages = types
		.filter(function (type) {
			return 'class' === type.type
		})
		.map(function (type) {
			return { url: type.fullName.toLowerCase() };
		});

	nav[0].pages[1].pages = types
		.filter(function (type) {
			return 'mixin' === type.type
		})
		.map(function (type) {
			return { url: type.fullName.toLowerCase() };
		});

	return nav;
}

/**
 * [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function getMemberPages(root, template, data) {
	data = data.toJSON()
	data.datapath = data.type + '_' + data.fullName.replace(/\./g, '_').toLowerCase();
	data.desc = data.desc.replace(/\n/g, ' ');

	data.methods = []
	data.properties = []
	data.events = []
	data.keywords = []
	data.borrows = data.borrows || []

	var parents = [data].concat(data.borrows.map(function (parentName) {
		return root.getTypes().find(function (type) {
			return type.fullName === parentName
		}).toJSON()
	}))

	parents.forEach(function (parent) {
		parent.members.forEach(function (member) {
			data.keywords.push(member.name);
			member.definedBy = parent.fullName

			if ('property' === member.type) {
				data.properties.push(member);
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
		})
	})

	data.methods = sortMembers(data.methods)
	data.properties = sortMembers(data.properties)
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
		return ('api/' + data.type + '/' + data.fullName + '.md').toLowerCase();
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

	var returnType = member.return ? member.return.types.join(', ') : 'undefined';

	switch (member.type) {
		case 'callback':
			return 'function ' + member.name + '(' + params + '):' + returnType;

		case 'constructor':
			return 'public constructor function ' + type.name + '(' + params + '):' + returnType;

		case 'method':
			return '' + member.name + '(' + params + '):' + returnType;

		case 'event':
			return 'public event ' + member.name + '(' + params + ')';

		case 'property':
			return 'public ' + member.name + ' : ' + member.dataTypes.join('/');

		case 'setting':
			return 'public ' + member.name + ' : ' + member.dataTypes.join('/');
	}
}
