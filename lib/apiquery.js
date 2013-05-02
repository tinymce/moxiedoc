var jsonQuery = require('json-query');

function ApiQuery(api) {
	this.api = api;
}

ApiQuery.prototype.getClassNames = function() {
	var classNames = [];

	for (var name in this.api) {
		classNames.push(name);
	}

	return classNames;
};

ApiQuery.prototype.find = function(expr) {
	return jsonQuery(expr, {
		rootContext: this.api
	}).references;
};

ApiQuery.prototype.getTypes = function() {
	return this.api;
};

exports.ApiQuery = ApiQuery;
