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
function Exporter(settings: {} = {}) {
  this.settings = settings;
}

Exporter.prototype.exportTo = function(types: string[], dirPath: string) {
  const templatePath = '../templates/' + this.settings.template + '/template.js';

  require(templatePath).template.call(this, types, dirPath);
};

export {
  Exporter
};