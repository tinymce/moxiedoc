var Builder = require('../lib/moxiedoc').Builder;

exports.testInit = function(test) {
	var builder = new Builder({});

	test.equals(typeof(builder), "object");
	test.ok(builder instanceof Builder);
	test.done();
};

exports.testParseSimpleClassNoDesc = function(test) {
	var builder = new Builder({});

	builder.parser.parse([
		"/**",
		" * @class namespace.Class",
		" */"
	].join('\n'));

	test.deepEqual(builder.toJSON(), [
		{
			"type": "class",
			"fullName": "namespace.Class",
			"name": "Class",
			"desc": "",
			"members": [],
			"source": {line: 2, file: undefined}
		}
	]);

	test.done();
};

exports.testParseSimpleClassDesc = function(test) {
	var builder = new Builder({});

	builder.parser.parse([
		"/**",
		" * MyClass",
		" * @class namespace.Class",
		" */"
	].join('\n'));

	test.deepEqual(builder.toJSON(), [
		{
			"type": "class",
			"fullName": "namespace.Class",
			"name": "Class",
			"desc": "MyClass",
			"members": [],
			"source": {line: 3, file: undefined}
		}
	]);

	test.done();
};
