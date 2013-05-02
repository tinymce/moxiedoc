var ApiQuery = require('./apiquery').ApiQuery;

/**
 * Exports the specified API JSON structure using the specified template.
 *
 * @class Exporter
 */

/**
 * Constructs a new Exporter instance.
 *
 * @constructor
 */
function Exporter(settings) {
	settings = settings || {};
	this.settings = settings;

	settings.template = 'cli';
}

Exporter.templates = {};

Exporter.addTemplate = function(name, callback) {
	Exporter.templates[name.toLowerCase()] = callback;
};

Exporter.prototype.exportTo = function(types, dirPath) {
	var templatePath = '../templates/' + this.settings.template + '/template.js';

	require(templatePath).template.call(this, new ApiQuery(types), dirPath);
};

exports.Exporter = Exporter;
