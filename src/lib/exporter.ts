import { Api } from './api';

/**
 * Exports the specified API JSON structure using the specified template.
 *
 * @class moxiedoc.Exporter
 */
class Exporter {
  public settings: Record<string, any>;

  /**
   * Constructs a new Exporter instance.
   *
   * @constructor
   */
  constructor(settings: {} = {}) {
    this.settings = settings;
  }

  public exportTo(types: Api, dirPath: string) {
    const templatePath = '../templates/' + this.settings.template + '/template.js';

    require(templatePath).template.call(this, types, dirPath);
  };
}

export {
  Exporter
};