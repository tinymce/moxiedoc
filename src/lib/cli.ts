#! /usr/bin/env node
/* eslint-disable no-console */

import { program } from 'commander';

import { MoxiedocSettings, process as moxieDocProcess } from './moxiedoc';

process.argv[1] = 'moxiedoc';

program
  .version('0.2.0')
  .usage('[options] <dir ...>')
  .option('-o, --out <path>', 'output path, default: out')
  .option('-t, --template <template>', 'template name')
  .option('-v, --verbose', 'verbose output')
  .option('--debug', 'debug output')
  .option('--dry', 'dry run only syntax check')
  .option('--fail-on-warning', 'fail if warnings are produced')
  .parse(process.argv);

program.on('--help', () => {
  console.log('  Examples:');
  console.log('    moxiedoc js');
  console.log('    moxiedoc -v -t cli -f namespace.Class js/**.js');
  console.log('');
});

if (!program.args.length) {
  program.help();
}

const opts = program.opts() as MoxiedocSettings;
opts.paths = program.args;

const { errors, warnings } = moxieDocProcess(opts);

if (errors > 0 || warnings > 0 && opts.failOnWarning) {
  process.exit(1);
}
