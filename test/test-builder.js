var Builder = require('../dist/lib/moxiedoc').Builder;

exports.testInit = function(test) {
  var builder = new Builder({});

  test.equals(typeof(builder), 'object');
  test.ok(builder instanceof Builder);
  test.done();
};

exports.testParseSimpleClassNoDesc = function(test) {
  var builder = new Builder({});

  builder.parser.parse([
    '/**',
    ' * @class namespace.Class',
    ' */'
  ].join('\n'));

  test.deepEqual(builder.api.toJSON(), {
    types: [
      {
        type: 'class',
        fullName: 'namespace.Class',
        name: 'Class',
        desc: '',
        source: { line: 2, file: undefined },
        summary: '',
        members: []
      }
    ]
  });

  test.done();
};

exports.testParseSimpleClassDesc = function(test) {
  var builder = new Builder({});

  builder.parser.parse([
    '/**',
    ' * MyClass. b',
    ' * @class namespace.Class',
    ' */'
  ].join('\n'));

  test.deepEqual(builder.api.toJSON(), {
    types: [
      {
        type: 'class',
        fullName: 'namespace.Class',
        name: 'Class',
        desc: 'MyClass. b',
        source: { line: 3, file: undefined },
        summary: 'MyClass',
        members: []
      }
    ]
  });

  test.done();
};
