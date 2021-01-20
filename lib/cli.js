#! /usr/bin/env node

var program = require('commander');
var moxiedoc = require('./moxiedoc');

process.argv[1] = 'moxiedoc';

program
  .version('0.0.1')
  .usage('[options] <dir ...>')
  .option('-o, --out <path>', 'output path, default: out')
  .option('-t, --template <template>', 'template name')
  .option('-v, --verbose', 'verbose output')
  .option('--debug', 'debug output')
  .option('--dry', 'dry run only syntax check')
  .parse(process.argv);

program.on('--help', function(){
	console.log('  Examples:');
	console.log('    moxiedoc js');
	console.log('    moxiedoc -v -t cli -f namespace.Class js/**.js');
	console.log('');
});

if (!program.opts().length) {
	program.help();
}

program.paths = program.opts();

moxiedoc.process(program);
