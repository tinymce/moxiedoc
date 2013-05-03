/**
 * Exports the specified API JSON structure using the specified template.
 *
 * @class moxiedoc.Exporter
 */

/**
 * Constructs a new Exporter instance.
 *
 * @constructor
 */
function Exporter(settings) {
	settings = settings || {};
	this.settings = settings;
}

Exporter.templates = {};

Exporter.addTemplate = function(name, callback) {
	Exporter.templates[name.toLowerCase()] = callback;
};

Exporter.prototype.exportTo = function(types, dirPath) {
	var templatePath = '../templates/' + this.settings.template + '/template.js';

	require(templatePath).template.call(this, types, dirPath);
};

exports.Exporter = Exporter;
