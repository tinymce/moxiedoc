var program = require('commander');
var Builder = require('./moxiedoc').Builder;
var Exporter = require('./moxiedoc').Exporter;
var wildcard = require('wildcard');
var fs = require('fs');
var path = require('path');

process.argv[1] = 'moxiedoc';

program
  .version('0.0.1')
  .usage('[options] <dir ...>')
  .option('-o, --out <path>', 'output path, default: out')
  .option('-t, --template <template>', 'template name')
  .option('-f, --filter', 'filter out namespaces/types/members')
  .option('-v, --verbose', 'verbose output')
  .parse(process.argv);

program.on('--help', function(){
	console.log('  Examples:');
	console.log('    moxiedoc js');
	console.log('    moxiedoc -v -t cli -f namespace.Class js/**.js');
	console.log('');
});

if (!program.args.length) {
	program.help();
}

var builder = new Builder();

function listFiles(dirPath, pattern) {
	var output = [];

	fs.readdirSync(dirPath).forEach(function(filePath) {
		filePath = path.join(dirPath, filePath);

		if (fs.statSync(filePath).isDirectory()) {
			output = output.concat(listFiles(filePath, pattern));
		} else if (wildcard(pattern, path.basename(filePath))) {
			output.push(filePath);
		}
	});

	return output;
}

program.args.forEach(function(arg) {
	listFiles(arg, "*.js").forEach(function(filePath) {
		builder.parser.parseFile(filePath);
	});
});

var exporter = new Exporter({
	template: program.template || 'cli'
});

exporter.exportTo(builder.api, program.out || 'out');
