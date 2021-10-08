/**
 * Param class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Param
 */
class Param {
  /**
   * Constructs a new Param instance.
   *
   * @constructor
   * @param {Object} data Json structure with member data.
   */
  constructor (data: Record<string, any>) {
    for (const name in data) {
      this[name] = data[name];
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
  };
}

export {
  Param
};
