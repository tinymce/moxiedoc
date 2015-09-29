var Parser = require('./parser').Parser;
var Builder = require('./builder').Builder;
var Exporter = require('./exporter').Exporter;
var reporter = require('./reporter');
var wildcard = require('wildcard');
var fs = require('fs');
var path = require('path');

exports.Parser = Parser;
exports.Builder = Builder;
exports.Exporter = Exporter;

/**
 * Process the specified files and generate documentation.
 *
 * @method process
 * @example
 * moxiedoc.process({
 *     template: 'cli',
 *     verbose: true,
 *     debug: false,
 *     paths: [
 *         'js/classes'
 *     ],
 *     out: 'output'
 * });
 * @param  {[type]} settings [description]
 * @return {[type]}          [description]
 */
exports.process = function(settings) {
	settings.out = settings.out || 'tmp/out.zip';
	settings.template = settings.template || 'cli';

	if (settings.verbose) {
		reporter.setLevel(reporter.Levels.INFO);
	}

	if (settings.debug) {
		reporter.setLevel(reporter.Levels.DEBUG);
	}

	var builder = new Builder();

	function listFiles(dirPath, pattern) {
		var output = [];

		fs.readdirSync(dirPath).forEach(function(filePath) {
			filePath = path.join(dirPath, filePath);

			if (fs.statSync(filePath).isDirectory()) {
				output = output.concat(listFiles(filePath, pattern));
			} else if (wildcard(pattern, path.basename(filePath))) {
				output.push(filePath);
			}
		});

		return output;
	}

	settings.paths.forEach(function(filePath) {
		if (fs.statSync(filePath).isDirectory()) {
			listFiles(filePath, "*.js").forEach(function(filePath) {
				builder.parser.parseFile(filePath);
			});
		} else {
			builder.parser.parseFile(filePath);
		}
	});

	builder.api.removePrivates();

	if (!settings.dry) {
		var exporter = new Exporter({
			template: settings.template
		});

		exporter.exportTo(builder.api, settings.out);
	}
};