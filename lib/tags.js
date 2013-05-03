var Builder = require('./builder').Builder;
var MemberInfo = require('./memberinfo').MemberInfo;
var TypeInfo = require('./typeinfo').TypeInfo;
var ParamInfo = require('./paraminfo').ParamInfo;

Builder.addTypeTags('class');
Builder.addMemberTags('method member constructor');

function splitTypes(types) {
	return types.split('/');
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

Builder.addTag('class enum struct', function(text, name) {
	this.currentType = this.target = this.addType(new TypeInfo({type: name, fullName: text}));
});

Builder.addTag('constructor method field property event', function(text, name, tags) {
	if (name == "constructor") {
		text = this.currentType.name;
	}

	this.target = this.currentMember = new MemberInfo({
		type: name,
		name: text,
		desc: findByName(tags, 'desc')[0].text
	});

	this.currentType.addMember(this.currentMember);
});

Builder.addTag('member', function(text, name, tags) {
	var matches = /^\{([^\}]+)\} (.+)$/.exec(text);

	if (matches) {
		this.target = this.currentMember = new MemberInfo({
			type: "field",
			dataTypes: splitTypes(matches[1]),
			name: matches[2],
			desc: findByName(tags, 'desc')[0].text
		});

		this.currentType.addMember(this.currentMember);
	} else {
		throw new Error("Unknown member format" + this.parser.info);
	}
});

Builder.addTag('return returns', function(text) {
	var matches = /^\{([^\}]+)\} ([\s\S]+)$/.exec(text);

	if (matches) {
		this.currentMember.data["return"] = {
			types: splitTypes(matches[1]),
			desc: matches[2]
		};
	} else {
		throw new Error("Unknown return format" + this.parser.info);
	}
});

Builder.addTag('public protected private', function(text, name) {
	this.target.access = name;
});

Builder.addTag('type', function(text) {
	this.target.dataType = text;
});

Builder.addBoolTag('abstract static readonly global');
Builder.addStringTag('access desc author default name deprecated version since summary todo');
Builder.addAliases({
	"virtual": "abstract"
});

Builder.addTag('param', function(text) {
	var matches = /^\{([^\}]+)\} ([^ ]+) (.+)$/.exec(text);
	if (matches) {
		var data = {
			types: splitTypes(matches[1]),
			desc: matches[3]
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
		this.currentMember.addParam(new ParamInfo(data));
	} else {
		//throw new Error("Unknown param format" + this.parser.info);
	}
});
