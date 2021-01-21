var clc = require('cli-color');

exports.template = function(root) {
  console.log(JSON.stringify(root, null, ' '));
};
