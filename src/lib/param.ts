/**
 * Param class contains details about methods, properties, events etc.
 *
 * @class moxiedoc.Param
 */

/**
 * Constructs a new Param instance.
 *
 * @constructor
 * @param {Object} data Json structure with member data.
 */
function Param(this: any, data: Record<string, any>):void {
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
Param.prototype.toJSON = function(): Record<string, any> {
  let json: Record<string, any> = {};

  for (const name in this) {
    if (typeof(this[name]) !== 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  return json;
};

export {
  Param
};
