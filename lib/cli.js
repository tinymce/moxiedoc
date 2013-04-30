var program = require('commander');
var Parser = require('./moxiedoc').Parser;
var glob = require('glob');

process.argv[1] = 'moxiedoc';

program
  .version('0.0.1')
  .usage('[options] <dir ...>')
  .option('-t, --template', 'template name or path')
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

var parser = new Parser({
	start: function(text, info) {
		console.log('start:', text, info.line);
	},

	tag: function(name, text, info) {
		console.log('tag:', name, 'text:', text, info.line);
	},

	end: function() {
		console.log('end');
	}
});

program.args.forEach(function(arg) {
	glob.sync(arg).forEach(function(filePath) {
		parser.parseFile(filePath);
	});
});

