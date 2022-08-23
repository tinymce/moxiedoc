import { Api } from './api';

export type ExportStructure = 'default' | 'legacy';

export interface ExporterSettings {
  readonly template: string;
  readonly structure: ExportStructure;
}

/**
 * Exports the specified API JSON structure using the specified template.
 *
 * @class moxiedoc.Exporter
 */
class Exporter {
  public settings: ExporterSettings;

  /**
   * Constructs a new Exporter instance.
   *
   * @constructor
   */
  public constructor(settings: ExporterSettings) {
    this.settings = settings;
  }

  public exportTo(types: Api, dirPath: string): void {
    const templatePath = '../templates/' + this.settings.template + '/template.js';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require(templatePath).template.call(this, types, dirPath, this.settings.structure);
  }
}

export {
  Exporter
};
