var Builder = require('./builder').Builder;
var Member = require('./member').Member;
var Type = require('./type').Type;
var Param = require('./param').Param;
var path = require('path');

Builder.addTypeTags('class struct mixin namespace');
Builder.addMemberTags('constructor method member property event callback field');

function isValidName(name) {
	return new RegExp('^[\\w.\\$]+$').test(name);
}

function splitTypes(types) {
	return types.split(/[\/\|]/);
}

function findByName(tags, name) {
	var output = [];

	tags.forEach(function(tag) {
		if (tag.name == name) {
			output.push(tag);
		}
	});

	return output;
}

Builder.addTag('class enum struct mixin', function(text, name) {
	var typeName = text;
	if (!isValidName(typeName)) {
		this.reporter.warn("Invalid type name:", typeName, this.parser.info);
		return;
	}

	this.currentType = this.target = this.api.addType(new Type({type: name, fullName: typeName}));
});

Builder.addTag('constructor method field property event setting callback', function(text, name, tags) {
	var desc, dataTypes;

	if (name == "constructor") {
		text = this.currentType.name;
	}

	if (name == "property" || name == "field" || name == "setting") {
		dataTypes = [];

		var matches = /^\{([^\}]+)\} (\w+)((?: [\s\S]+)?)$/.exec(text);

		if (matches) {
			text = matches[2];
			desc = matches[3];
			dataTypes = splitTypes(matches[1]);
		} else {
			var typeFullName = findByName(tags, 'type');

			if (typeFullName.length) {
				dataTypes = splitTypes(typeFullName[0].text);
			}
		}

		if (!dataTypes) {
			this.reporter.warn("No data type defined for:", name, this.parser.info);
		}

		if (name == "setting") {
			this.currentType.addMember(new Member({
				type: name,
				name: text,
				desc: desc || findByName(tags, 'desc')[0].text,
				dataTypes: dataTypes
			}));

			return;
		}
	}

	desc = desc || findByName(tags, 'desc')[0].text;
	if (!desc) {
		this.reporter.warn("Missing decription for:", name, this.parser.info);
	}

	var memberName = text;
	if (!isValidName(memberName)) {
		this.reporter.warn("Invalid member name:", memberName, this.parser.info);
		return;
	}

	this.target = this.currentMember = new Member({
		type: name,
		name: memberName,
		desc: desc,
		dataTypes: dataTypes
	});

	this.currentType.addMember(this.currentMember);
});

Builder.addTag('member', function(text, name, tags) {
	var matches = /^\{([^\}]+)\} (.+)$/.exec(text);

	if (matches) {
		var dataTypes = splitTypes(matches[1]);

		if (!dataTypes) {
			this.reporter.warn("No data type defined for:", name, this.parser.info);
		}

		var memberName = matches[2];
		if (!isValidName(memberName)) {
			this.reporter.warn("Invalid member name:", memberName, this.parser.info);
			return;
		}

		this.target = this.currentMember = new Member({
			type: "field",
			dataTypes: dataTypes,
			name: memberName,
			desc: findByName(tags, 'desc')[0].text
		});

		this.currentType.addMember(this.currentMember);
	} else {
		this.reporter.error("Unknown member format", this.parser.info);
	}
});

Builder.addTag('include', function(text) {
	var currentFile = this.parser.info.filePath;
	var oldInfo = this.parser.info.clone();

	try {
		this.parser.parseFile(path.join(path.dirname(this.parser.info.filePath), text));
	} catch (e) {
		this.reporter.error("Could not parse file:", text, 'that was included in:', currentFile);
	}

	this.parser.info = oldInfo;
});

Builder.addTag('borrow-members', function(text) {
	if (!this.target.borrows) {
		this.target.borrows = [];
	}

	this.target.borrows.push(text);
});

Builder.addTag('return returns', function(text) {
	var matches = /^\{([^\}]+)\}([\s\S]*)$/.exec(text);

	if (matches) {
		var desc = matches[2].trim();

		if (!desc) {
			this.reporter.warn("Missing decription for: return", this.parser.info);
		}

		this.currentMember["return"] = {
			types: splitTypes(matches[1]),
			desc: desc
		};
	} else {
		this.reporter.error("Unknown return format.", this.parser.info);
	}
});

Builder.addTag('public protected private', function(text, name) {
	this.target.access = name;
});

Builder.addTag('type', function(text) {
	if (!isValidName(text)) {
		this.reporter.warn("Invalid type name:", text, this.parser.info);
		return;
	}

	this.target.dataType = text;
});

Builder.addTag('mixes', function(text) {
	this.currentType.addMixin(text);
});

Builder.addTag('namespace', function(text, name, tags) {
	var namespace = this.api.createNamespace(text);

	namespace.summary = findByName(tags, 'desc')[0].text;
	namespace.desc = findByName(tags, 'desc')[0].text;

	this.target = namespace;
});

Builder.addBoolTag('abstract static readonly global final ignore-file');
Builder.addStringTag('access desc author default name deprecated version since summary todo extends see');
Builder.addAliases({
	"virtual": "abstract"
});

Builder.addTag('example', function(text) {
	if (!this.target.examples) {
		this.target.examples = [];
	}

	this.target.examples.push({
		content: text
	});
});

Builder.addTag('param', function(text) {
	if (!this.currentMember) {
		this.reporter.warn("Param added to unnamed member.", this.parser.info);
		return;
	}

	var matches = /^\{([^\}]+)\} ([^ ]+)([\s\S]*)$/.exec(text);
	if (matches) {
		var desc = matches[3].trim();

		if (!desc) {
			this.reporter.warn("Missing decription for: param", this.parser.info);
		}

		var data = {
			types: splitTypes(matches[1]),
			desc: desc
		};

		var paramName = matches[2];
		matches = /^\[([^\]=]+)(?:=([^\]]*))?\]$/.exec(paramName);
		if (matches) {
			paramName = matches[1];
			data.optional = true;

			if (matches[2]) {
				data["default"] = matches[2];
			}
		}

		data.name = paramName;
		this.currentMember.addParam(new Param(data));
	} else {
		this.reporter.error("Unknown param format.", this.parser.info);
		this.reporter.info("Param text:", text);
	}
});
