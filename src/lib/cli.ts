#! /usr/bin/env node

const { program } = require('commander');
import { process as moxieDocProcess } from './moxiedoc';

process.argv[1] = 'moxiedoc';

program
  .version('0.1.0')
  .usage('[options] <dir ...>')
  .option('-o, --out <path>', 'output path, default: out')
  .option('-t, --template <template>', 'template name')
  .option('-v, --verbose', 'verbose output')
  .option('--debug', 'debug output')
  .option('--dry', 'dry run only syntax check')
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

const opts = program.opts();
opts.paths = program.args;

moxieDocProcess(opts);
