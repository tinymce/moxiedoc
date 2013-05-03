var program = require('commander');
var Builder = require('./moxiedoc').Builder;
var Exporter = require('./moxiedoc').Exporter;
var glob = require('glob');

process.argv[1] = 'moxiedoc';

program
  .version('0.0.1')
  .usage('[options] <dir ...>')
  .option('-t, --template <template>', 'template name')
  .option('-f, --filter', 'filter out namespaces/types/members')
  .option('-v, --verbose', 'verbose output')
  .parse(process.argv);

program.on('--help', function(){
	console.log('  Examples:');
	console.log('    moxiedoc js');
	console.log('    moxiedoc -v -t cli -f namespace.Class js/**/*.js');
	console.log('');
});

if (!program.args.length) {
	program.help();
}

var builder = new Builder();

// Parse JS files
program.args.forEach(function(arg) {
	glob.sync(arg).forEach(function(filePath) {
		builder.parser.parseFile(filePath);
	});
});

var exporter = new Exporter({
	template: program.template || 'cli'
});

exporter.exportTo(builder.types, "out");
