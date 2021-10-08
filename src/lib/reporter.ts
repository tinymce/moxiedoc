import * as clc from 'cli-color';

const Levels = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

let currentLevel = Levels.WARN;

function log (level: number, message: string): void {
  switch (level) {
    case Levels.DEBUG:
      message = clc.magenta('Debug: ') + message;
      break;

    case Levels.INFO:
      message = clc.cyan('Info: ') + message;
      break;

    case Levels.WARN:
      message = clc.yellow('Warning: ') + message;
      break;

    case Levels.ERROR:
      message = clc.red('Error: ') + message;
      break;
  }

  console.log(message);
}

function createLogFunction(level: number) {
  return (...args: string[]) => {
    if (level >= currentLevel) {
      log(level, args.join(' '));
    }
  };
}

function setLevel(level: number) {
  currentLevel = level;
}

const debug = createLogFunction(Levels.DEBUG);
const info = createLogFunction(Levels.INFO);
const warn = createLogFunction(Levels.WARN);
const error = createLogFunction(Levels.ERROR);

export {
  setLevel,
  Levels,
  debug,
  info,
  warn,
  error,
};