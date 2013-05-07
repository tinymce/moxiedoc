var clc = require('cli-color');

var Levels = {
	DEBUG: 1,
	INFO: 2,
	WARN: 3,
	ERROR: 4
};

var currentLevel = Levels.WARN;

function log(level, message) {
	switch (level) {
		case Levels.DEBUG:
			message = clc.magenta("Debug: ") + message;
			break;

		case Levels.INFO:
			message = clc.cyan("Info: ") + message;
			break;

		case Levels.WARN:
			message = clc.yellow("Warning: ") + message;
			break;

		case Levels.ERROR:
			message = clc.red("Error: ") + message;
			break;
	}

	console.log(message);
}

function createLogFunction(level) {
	return function() {
		if (level >= currentLevel) {
			var args = Array.prototype.slice.call(arguments);
			log(level, args.join(' '));
		}
	};
}

function setLevel(level) {
	currentLevel = level;
}

exports.setLevel = setLevel;
exports.Levels = Levels;
exports.debug = createLogFunction(Levels.DEBUG);
exports.info = createLogFunction(Levels.INFO);
exports.warn = createLogFunction(Levels.WARN);
exports.error = createLogFunction(Levels.ERROR);
