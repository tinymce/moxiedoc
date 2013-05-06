var fs = require('fs');

/**
 * This class parses jsdoc style comment blocks and calls start, tag and end based on the content.
 * It's a low level parser only fireing events for each token it finds.
 *
 * @example
 * var parser = new Parser({
 *     start: function(text) {
 *         console.log('Comment block start', text);
 *     },
 *
 *     tag: function(name, text) {
 *         console.log('Tag name:', name, 'Text:', text);
 *     },
 *
 *     end: function() {
 *         console.log('End of block');
 *     }
 * });
 *
 * parser.parse("myfile.js");
 *
 * @example
 * var parser = new Parser();
 *
 * parser.on("start", callback);
 *
 * parser.parse("myfile.js");
 *
 * @class moxiedoc.Parser
 * @extends events.EventEmitter
 */

/**
 * Creates a new parser instance with the optional settings.
 *
 * @constructor
 * @param {Object} [settings={}] Name/value collection with settings.
 */
function Parser(settings) {
	settings = settings || {};

	if (settings.start) {
		this.on("start", settings.start);
	}

	if (settings.tag) {
		this.on("tag", settings.tag);
	}

	if (settings.end) {
		this.on("end", settings.end);
	}

	this.settings = settings;
	this.info = {
		line: 0,
		toString: function() {
			return "File: " + this.filePath + ':' + this.line + ':0';
		}
	};
}

Parser.prototype = Object.create(require('events').EventEmitter.prototype);

/**
 * Parses the specified string and calls events when it finds comment blocks and tags.
 *
 * @method parse
 * @param {String} content Content to parse.
 */
Parser.prototype.parse = function(content) {
	var self = this, info = this.info;
	var inBlock, inStart, startText, currentTag, currentTagText;
	var startInfo, tagInfo;

	this.emit("parse");

	function endStart() {
		// End of start
		if (inStart) {
			self.emit("start", startText.trim(), startInfo);
			inStart = false;
		}
	}

	function endTag() {
		if (currentTag) {
			self.emit("tag", currentTag, currentTagText.trim(), tagInfo);
			currentTagText = currentTag = "";
		}
	}

	function endBlock() {
		if (inBlock) {
			self.emit("end", currentTag, info);
			inBlock = inStart = false;
		}
	}

	/**
	 * Current lines in a parse operation.
	 *
	 * @member {Array} lines
	 */
	this.lines = content.split('\n');

	this.lines.forEach(function(line, i) {
		var matches;

		info.line = i;

		// Start: /**
		if (/^\s*\/\*\*/.test(line)) {
			inBlock = inStart = true;
			startInfo = {line: i, filePath: info.filePath};
			startText = "";
			return;
		}

		// End: */
		if (inBlock && /^\s*\*\//.test(line)) {
			endStart();
			endTag();
			endBlock();
			return;
		}

		// Line inside comment
		if (inBlock) {
			// Parse away * character
			matches = /^\s*\* ?(.*)/.exec(line);
			line = matches ? matches[1] : line;

			// Tag: @<something>
			matches = /^\s*@([^ ]+)(.*)/.exec(line);
			if (matches) {
				endStart();
				endTag();

				currentTag = matches[1];
				currentTagText = matches[2] + '\n';
				tagInfo = {line: i, filePath: info.filePath};

				return;
			}

			if (inStart) {
				startText += line + '\n';
			}

			if (currentTag) {
				currentTagText += line + '\n';
			}
		}
	});

	endStart();
	endTag();
	endBlock();

	this.lines = null;
};

/**
 * Parses the specified file.
 *
 * @method parseFile
 * @param {String} filePath Path to the file to parse.
 * @param {String} [encoding=utf-8] Encoding to use.
 */
Parser.prototype.parseFile = function(filePath, encoding) {
	this.info.filePath = filePath;
	encoding = encoding || 'utf-8';
	this.parse(fs.readFileSync(filePath, {encoding: encoding}).toString());
};

exports.Parser = Parser;
