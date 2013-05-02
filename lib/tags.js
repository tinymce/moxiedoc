var JsonBuilder = require('./jsonbuilder').JsonBuilder;

JsonBuilder.addTypeTags('class enum');
JsonBuilder.addMemberTags('method member constructor');

JsonBuilder.addTag('class enum', function(text, name) {
	var classFullName = text;

	this.target = this.types[classFullName] = {
		type: name,
		name: classFullName.split('.').pop()
	};

	this.currentType = this.target;
	this.currentType.access = 'public';
});

JsonBuilder.addTag('constructor', function(text, name, tags) {
	function findByName(name) {
		var output = [];

		tags.forEach(function(tag) {
			if (tag.name == name) {
				output.push(tag);
			}
		});

		return output;
	}

	if (!this.currentType.constructors) {
		this.currentType.constructors = [];
	}

	this.target = this.currentMember = {
		name: text,
		desc: findByName('desc')[0].text
	};

	this.currentType.constructors.push(this.currentMember);
});

JsonBuilder.addTag('method', function(text, name, tags) {
	function findByName(name) {
		var output = [];

		tags.forEach(function(tag) {
			if (tag.name == name) {
				output.push(tag);
			}
		});

		return output;
	}

	if (!this.currentType.methods) {
		this.currentType.methods = [];
	}

	this.target = this.currentMember = {
		name: text,
		desc: findByName('desc')[0].text,
		access: 'public'
	};

	this.currentType.methods.push(this.currentMember);
});

JsonBuilder.addTag('member', function(text, name, tags) {
	function findByName(name) {
		var output = [];

		tags.forEach(function(tag) {
			if (tag.name == name) {
				output.push(tag);
			}
		});

		return output;
	}

	if (!this.currentType.fields) {
		this.currentType.fields = [];
	}

	this.target = this.currentMember = {
		name: text,
		desc: findByName('desc')[0].text,
		access: 'public'
	};

	this.currentType.fields.push(this.currentMember);
});

JsonBuilder.addTag('public protected private', function(text, name) {
	this.target.access = name;
});

JsonBuilder.addBoolTag('abstract static readonly global');
JsonBuilder.addStringTag('access desc author default name deprecated');
JsonBuilder.addAliases({
	"virtual": "abstract"
});

JsonBuilder.addTag('param', function(text) {
	var target = this.target;

	if (!target.params) {
		target.params = [];
	}

	var matches = /^\{([^\}]+)\} (\w+) (.+)$/.exec(text);
	if (matches) {
		target.params.push({
			name: matches[2],
			type: matches[1],
			desc: matches[3]
		});
	}
});
