import { assert } from 'chai';

import { Builder } from '../lib/builder';

describe('Builder', () => {
  it('init', () => {
    const builder = new Builder();

    assert.typeOf(builder, 'object');
    assert.instanceOf(builder, Builder);
  });

  it('parse simple class with no description', () => {
    const builder = new Builder();

    builder.parser.parse([
      '/**',
      ' * @class namespace.Class',
      ' */'
    ].join('\n'));

    assert.deepEqual(builder.api.toJSON(), {
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
  });

  it('parse simple class with description', () => {
    const builder = new Builder();

    builder.parser.parse([
      '/**',
      ' * MyClass. b',
      ' * @class namespace.Class',
      ' */'
    ].join('\n'));

    assert.deepEqual(builder.api.toJSON(), {
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
  });
});
