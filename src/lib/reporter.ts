import * as clc from 'cli-color';

const enum Level {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR= 4
}

let currentLevel = Level.WARN;
const hooks = [];

function log (level: Level, message: string): void {
  switch (level) {
    case Level.DEBUG:
      message = clc.magenta('Debug: ') + message;
      break;

    case Level.INFO:
      message = clc.cyan('Info: ') + message;
      break;

    case Level.WARN:
      message = clc.yellow('Warning: ') + message;
      break;

    case Level.ERROR:
      message = clc.red('Error: ') + message;
      break;
  }

  hooks.forEach((hook) => {
    hook(level, message);
  })

  console.log(message);
}

function createLogFunction(level: Level) {
  return (...args: string[]) => {
    if (level >= currentLevel) {
      log(level, args.join(' '));
    }
  };
}

function setLevel(level: Level) {
  currentLevel = level;
}

function addHook(hook: (level: Level, message: string) => void) {
  hooks.push(hook);
}

const debug = createLogFunction(Level.DEBUG);
const info = createLogFunction(Level.INFO);
const warn = createLogFunction(Level.WARN);
const error = createLogFunction(Level.ERROR);

export {
  setLevel,
  addHook,
  Level,
  debug,
  info,
  warn,
  error,
};