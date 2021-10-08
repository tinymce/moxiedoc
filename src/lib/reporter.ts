import * as clc from 'cli-color';

const Levels = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

let currentLevel = Levels.WARN;
const hooks = [];

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

  hooks.forEach((hook) => {
    hook(level, message);
  })

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

function addHook(hook: (level: number, message: string) => void) {
  hooks.push(hook);
}

const debug = createLogFunction(Levels.DEBUG);
const info = createLogFunction(Levels.INFO);
const warn = createLogFunction(Levels.WARN);
const error = createLogFunction(Levels.ERROR);

export {
  setLevel,
  addHook,
  Levels,
  debug,
  info,
  warn,
  error,
};