var fs = require('fs');
var path = require('path');

function renderIndex(types) {
	var markdown = [];

	markdown.push('## Classes');

	types.forEach(function(typeInfo) {
		markdown.push('[[' + typeInfo.fullName + '|' + typeInfo.name + ']]');
	});

	return markdown;
}

function renderMemberIndex(title, members) {
	var markdown = [];

	if (members.length) {
		markdown.push('## ' + title);

		members.forEach(function(memberInfo) {
			markdown.push('* [' + memberInfo.name + '](' + memberInfo.name + ')');
		});

		markdown.push('');
		markdown.push('');
	}

	return markdown.join('\n');
}

function renderParams(params) {
	var markdown = [];

	if (params.length) {
		markdown.push('**Parameters**');
		markdown.push('');

		params.forEach(function(paramInfo) {
			if (paramInfo.data.optional) {
				if (paramInfo.data['default']) {
					markdown.push('[' + paramInfo.name + '=' + paramInfo.data['default'] + '] {' + paramInfo.data.type + '} ' + paramInfo.data.desc);
				} else {
					markdown.push('[' + paramInfo.name + '] {' + paramInfo.data.type + '} ' + paramInfo.data.desc);
				}
			} else {
				markdown.push(paramInfo.name + ' {' + paramInfo.data.type + '} ' + paramInfo.data.desc);
			}
		});
	}

	return markdown.join('\n');
}

function renderMembers(title, members) {
	var markdown = [];

	if (members.length) {
		markdown.push('## ' + title);

		members.forEach(function(memberInfo) {
			var source = memberInfo.data.source;

			markdown.push('### ' + memberInfo.name);

			markdown.push('<a name="' + memberInfo.name + '" />');
			markdown.push('_Defined at: [' + source.file + ':' + source.line + '](' + source.file + '#' + source.line + ')_');
			markdown.push('');

			markdown.push(renderParams(memberInfo.getParams()));

			markdown.push('');
		});

		markdown.push('');
	}

	return markdown.join('\n');
}

function renderType(typeInfo) {
	var markdown = '';

	markdown += '# Class: ' + typeInfo.fullName + '\n';
	markdown += typeInfo.data.desc + '\n\n';

	// Index
	markdown += renderMemberIndex('Constructors', typeInfo.getConstructors());
	markdown += renderMemberIndex('Methods', typeInfo.getMethods());
	markdown += renderMemberIndex('Properties', typeInfo.getProperties());
	markdown += renderMemberIndex('Events', typeInfo.getEvents());
	markdown += renderMemberIndex('Fields', typeInfo.getFields());

	// Members
	markdown += renderMembers('Constructors', typeInfo.getConstructors());
	markdown += renderMembers('Methods', typeInfo.getMethods());
	markdown += renderMembers('Properties', typeInfo.getProperties());
	markdown += renderMembers('Events', typeInfo.getEvents());
	markdown += renderMembers('Fields', typeInfo.getFields());

	return markdown;
}

exports.template = function(types, toPath) {
	function putFileContents(filePath, content) {
		fs.writeFileSync(path.join(toPath, filePath), content);
	}

	putFileContents('index.md', renderIndex(types, toPath));

	types.forEach(function(typeInfo) {
		putFileContents(typeInfo.fullName + '.md', renderType(typeInfo));
	});
};
