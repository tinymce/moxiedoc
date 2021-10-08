export interface ParamData {
  readonly types: string[];
  readonly desc: string;
  optional?: boolean;
  name?: string;
  default?: string;
}

/**
 * Param class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Param
 */
class Param {
  public default: string;
  public desc: string;
  public name: string;
  public optional: boolean;
  public types: string[];

  /**
   * Constructs a new Param instance.
   *
   * @constructor
   * @param {Object} data Json structure with member data.
   */
  public constructor(data: ParamData) {
    for (const name in data) {
      if (data.hasOwnProperty(name)) {
        this[name] = data[name];
      }
    }
  }

  /**
   * Serializes the Param as JSON.
   *
   * @method toJSON
   * @return {Object} JSON object.
   */
  public toJSON(): Record<string, any> {
    const json: Record<string, any> = {};

    for (const name in this) {
      if (typeof (this[name]) !== 'function' && name.indexOf('_') !== 0) {
        json[name] = this[name];
      }
    }

    return json;
  }
}

export {
  Param
};
