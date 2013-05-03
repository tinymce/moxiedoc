var Parser = require('../lib/moxiedoc').Parser;

exports.testInit = function(test) {
	var parser = new Parser({});

	test.equals("object", typeof(parser));
	test.ok(parser instanceof Parser);
	test.done();
};

exports.parseNoDocComments = function(test) {
	var start = 0, tag = 0, end = 0;

	var parser = new Parser({
		start: function() {
			start++;
		},

		tag: function() {
			tag++;
		},

		end: function() {
			end++;
		}
	});

	parser.parse("something");

	test.equals(0, start);
	test.equals(0, tag);
	test.equals(0, end);

	test.done();
};

exports.parseStartSingleLine = function(test) {
	var start = 0, tag = 0, end = 0;
	var startText;

	var parser = new Parser({
		start: function(text) {
			start++;
			startText = text;
		},

		tag: function() {
			tag++;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		"* a",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a", startText);
	test.equals(0, tag);
	test.equals(1, end);

	test.done();
};

exports.parseStartSingleLineNoAsterix = function(test) {
	var start = 0, tag = 0, end = 0;
	var startText;

	var parser = new Parser({
		start: function(text) {
			start++;
			startText = text;
		},

		tag: function() {
			tag++;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		" a",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a", startText);
	test.equals(0, tag);
	test.equals(1, end);

	test.done();
};

exports.parseStartMultipleLines = function(test) {
	var start = 0, tag = 0, end = 0;
	var startText, startInfo;

	var parser = new Parser({
		start: function(text, info) {
			start++;
			startText = text;
			startInfo = info;
		},

		tag: function() {
			tag++;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		"* a",
		"* b",
		"* c",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a\nb\nc", startText);
	test.equals(0, tag);
	test.equals(1, end);
	test.equals(0, startInfo.line);

	test.done();
};

exports.parseTagSingleLine = function(test) {
	var start = 0, tag = 0, end = 0;
	var startText, tagName, tagText, tagInfo;

	var parser = new Parser({
		start: function(text) {
			start++;
			startText = text;
		},

		tag: function(name, text, info) {
			tag++;
			tagName = name;
			tagText = text;
			tagInfo = info;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		"* @a b",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("", startText);
	test.equals("a", tagName);
	test.equals("b", tagText);
	test.equals(1, tag);
	test.equals(1, end);
	test.equals(1, tagInfo.line);

	test.done();
};

exports.parseTagMultipleLines = function(test) {
	var start = 0, tag = 0, end = 0;
	var tagName, tagText;

	var parser = new Parser({
		start: function() {
			start++;
		},

		tag: function(name, text) {
			tag++;
			tagName = name;
			tagText = text;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		"* @a b",
		"* c",
		"* d",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a", tagName);
	test.equals("b\nc\nd", tagText);
	test.equals(1, tag);
	test.equals(1, end);

	test.done();
};

exports.parseTagSingleLineAfterText = function(test) {
	var start = 0, tag = 0, end = 0;
	var tagName, tagText, tagInfo;

	var parser = new Parser({
		start: function() {
			start++;
		},

		tag: function(name, text, info) {
			tag++;
			tagName = name;
			tagText = text;
			tagInfo = info;
		},

		end: function() {
			end++;
		}
	});

	parser.parse([
		"/**",
		"* text",
		"* @a b",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a", tagName);
	test.equals("b", tagText);
	test.equals(1, tag);
	test.equals(1, end);
	test.equals(2, tagInfo.line);

	test.done();
};

exports.parseStartTextAndTagWithEvents = function(test) {
	var start = 0, tag = 0, end = 0;
	var tagName, startText, tagText, tagInfo;

	var parser = new Parser();

	parser.on('start', function(text) {
		start++;
		startText = text;
	});

	parser.on('tag', function(name, text, info) {
		tag++;
		tagName = name;
		tagText = text;
		tagInfo = info;
	});

	parser.on('end', function() {
		end++;
	});

	parser.parse([
		"/**",
		"* text",
		"* @a b",
		"*/"
	].join('\n'));

	test.equals(1, start);
	test.equals("a", tagName);
	test.equals("b", tagText);
	test.equals(1, tag);
	test.equals(1, end);
	test.equals(2, tagInfo.line);

	test.done();
};