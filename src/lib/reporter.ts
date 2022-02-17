import * as clc from 'cli-color';

export const enum Level {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

type ReporterHook = (level: Level, message: string) => void;

let currentLevel = Level.WARN;
const hooks: ReporterHook[] = [];

const log = (level: Level, message: string): void => {
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
  });

  // eslint-disable-next-line no-console
  console.log(message);
};

const createLogFunction = (level: Level) => (...args: string[]) => {
  if (level >= currentLevel) {
    log(level, args.join(' '));
  }
};

const setLevel = (level: Level): void => {
  currentLevel = level;
};

const addHook = (hook: ReporterHook): void => {
  hooks.push(hook);
};

const debug = createLogFunction(Level.DEBUG);
const info = createLogFunction(Level.INFO);
const warn = createLogFunction(Level.WARN);
const error = createLogFunction(Level.ERROR);

export {
  setLevel,
  addHook,
  debug,
  info,
  warn,
  error
};