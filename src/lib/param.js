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
function Param(data) {
  for (var name in data) {
    this[name] = data[name];
  }
}

/**
 * Serializes the Param as JSON.
 *
 * @method toJSON
 * @return {Object} JSON object.
 */
Param.prototype.toJSON = function() {
  var json = {};

  for (var name in this) {
    if (typeof(this[name]) != 'function' && name.indexOf('_') !== 0) {
      json[name] = this[name];
    }
  }

  return json;
};

exports.Param = Param;

