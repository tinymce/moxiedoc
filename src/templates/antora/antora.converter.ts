import { Return } from '../../lib/member';
import { Param } from '../../lib/param';

export interface PageOutput {
  readonly type: 'adoc' | 'json';
  readonly filename: string;
  readonly content: string;
}

const hasValue = <T>(x: T): x is NonNullable<T> => {
  // empty helper for strings, objects, arrays
  if (typeof x === 'string' || Array.isArray(x)) {
    return x.length > 0;
  } else if (typeof x === 'object') {
    return Object.keys(x).length > 0;
  } else {
    return false;
  }
};

// escape comments from breaking asciidoc
const escapeComments = (str: string): string =>
  str.replace(/<!--/, '&lt;!--').replace(/-->/, '--&gt;');

// convert BRs found into asciidoc \n
const encodeBR = (str: string): string =>
  str.replace(/\s*<br\s*\/?>\s*/g, '\n');

// convert <em> into __italics__ asciidoc
const encodeEM = (str: string): string =>
  str.replace(/<\/?em>/g, '__');

// convert <strong> into **bold** asciidoc
const encodeStrong = (str: string): string =>
  str.replace(/<\/?strong>/g, '**');

// convert <code> into backtick asciidoc
const encodeCode = (str: string) => {
  const regex = /<code>(.*?)<\/code>/;
  let matches;
  while ((matches = regex.exec(str))) {
    str = str.replace(matches[0], '`' + matches[1] + '`').replace('"`', '`').replace('`"', '`');
  }
  return str;
};

// convert <a href> into asciidoc link
const encodeLinks = (str: string): string => {
  const matches = /[^<]*(<a href="([^"]+)">([^<]+)<\/a>)/.exec(str);
  if (matches !== null) {
    const asciidoc = 'link:' + matches[2] + '[' + matches[3] + ']';
    return str.replace(matches[1], asciidoc);
  } else {
    return str;
  }
};

// escape special asciidoc characters
const specialChars = {
  '|': '{vbar}',
  '+': '{plus}',
  '*': '{asterisk}'
};
const escapeSpecialChars = (str: string): string =>
  str.replace(/[|+*]/g, (match) => specialChars[match] || match);

// convert content that looks like asciidoc attributes (e.g {0}) to literal strings
// Note: Special characters should not be escaped
const specialAttrs = Object.values(specialChars);
const escapeAttributes = (str: string): string =>
  str.replace(/(\{\s*[\w\d-]+\s*\})/g, (match) => specialAttrs.indexOf(match) !== -1 ? match : `+${match}+`);

// runs a bunch of required cleanup filters, where embedded code/text can break asciidoc rendering
const cleanup = (str: string): string => {
  const filters = [ escapeSpecialChars, escapeAttributes, escapeComments, encodeBR, encodeEM, encodeStrong, encodeLinks, encodeCode ];
  return filters.reduce((acc, filter) => filter(acc), str);
};

const getNameFromFullName = (name: string): string =>
  name.split('.').slice(-1).join('');

const getFilePathFromFullName = (name: string): string => {
  const filename = name.toLowerCase() === 'tinymce' ? 'tinymce.root' : name.toLowerCase();
  return 'apis/' + filename + '.adoc';
};

const getFilePathFromFullNameLegacy = (name: string): string => {
  const folder = getNameFromFullName(name) + '/';
  const filename = name.toLowerCase() === 'tinymce' ? 'root_tinymce' : name.toLowerCase();
  return 'api/' + folder + filename + '.adoc';
};

const getFilePath = (structure: string): Function => {
  switch (structure) {
    case 'flat':
      return getFilePathFromFullName;

    case 'legacy':
      return getFilePathFromFullNameLegacy;

    default:
      return getFilePathFromFullName;
  }
};

const generateXref = (name: string, structure: string): string =>
  'xref:' + getFilePath(structure)(name) + '[' + getNameFromFullName(name) + ']';

const generateTypeXref = (type: string, structure: string): string =>
  type.includes('tinymce', 0) ? generateXref(type, structure) : type;

const generateExamples = (examples: Array<{ content: string }>): string => {
  let tmp = '\n==== Examples\n';
  examples.forEach((example) => {
    tmp += '[source, javascript]\n';
    tmp += '----\n';
    tmp += example.content + '\n';
    tmp += '----\n';
  });
  return tmp;
};

const generateParameters = (params: Param[], structure: string): string => {
  let tmp = '\n==== Parameters\n';
  params.forEach((param) => {
    tmp += '\n* `' + param.name + ' (' + param.types.map((type) => generateTypeXref(type, structure)).join(' | ') + ')` - ' + cleanup(param.desc);
  });
  return tmp + '\n';
};

const generateReturn = (ret: Return, structure: string): string => {
  let tmp = '\n==== Return value\n';
  ret.types.forEach((type) => {
    tmp += '\n* `' + generateTypeXref(type, structure) + '` - ' + cleanup(ret.desc);
  });
  return tmp += '\n';
};

const buildSummary = (data: Record<string, any>, structure: string): string => {
  let tmp = '';

  // settings
  // untested snippet, no settings data
  if (hasValue(data.settings)) {
    tmp += '\n[[settings]]\n';
    tmp += '=== Settings\n';

    tmp += '[cols="2,1,4,1",options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Type|Summary|Defined by\n';

    data.settings.forEach((item) => {
      tmp += '|' + item.name;
      tmp += '|`' + generateTypeXref(item.dataTypes[0], structure) + '`';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateXref(item.definedBy, structure) + '`\n';
    });
    tmp += '|===\n';
  }

  // properties
  if (hasValue(data.properties)) {
    tmp += '\n[[properties]]\n';
    tmp += '=== Properties\n';

    tmp += '[cols="2,1,4,1",options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Type|Summary|Defined by\n';

    data.properties.forEach((item) => {
      tmp += '|' + item.name;
      tmp += '|`' + generateTypeXref(item.dataTypes[0], structure) + '`';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateXref(item.definedBy, structure) + '`\n';
    });
    tmp += '|===\n';
  }

  // constructors
  if (hasValue(data.constructors)) {
    tmp += '\n[[constructors-summary]]\n';
    tmp += '=== Constructors\n';

    tmp += '[cols="2,5,1",options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';

    data.constructors.forEach((item) => {
      tmp += '|xref:#' + item.name + '[' + item.name + '()]';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateXref(item.definedBy, structure) + '`\n';
    });
    tmp += '|===\n';
  }

  // methods
  if (hasValue(data.methods)) {
    tmp += '\n[[methods-summary]]\n';
    tmp += '=== Methods\n';
    tmp += '[cols="2,5,1",options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';
    data.methods.forEach((item) => {
      tmp += '|xref:#' + item.name + '[' + item.name + '()]|' + cleanup(item.desc) + '|`' + generateXref(item.definedBy, structure) + '`\n';
    });
    tmp += '|===\n';
  }

  // events
  // untested snippet, no events data
  if (hasValue(data.events)) {
    tmp += '\n[[events-summary]]\n';
    tmp += '=== Events\n';

    tmp += '[cols="2,5,1",options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';

    data.events.forEach((item) => {
      tmp += '|xref:#' + item.name + '[' + item.name + ']';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateXref(item.definedBy, structure) + '`\n';
    });
    tmp += '|===\n';
  }

  return tmp.length > 0 ? '\n[[summary]]\n== Summary\n' + tmp : tmp;
};

const buildConstructor = (data: Record<string, any>, structure: string): string => {
  let tmp = '';

  if (hasValue(data.constructors)) {
    tmp += '\n[[constructors]]\n';
    tmp += '== Constructors\n';

    data.constructors.forEach((constructor) => {
      tmp += '\n[[' + constructor.name + ']]\n';
      tmp += '=== ' + constructor.name + '\n';
      tmp += '[source, javascript]\n';
      tmp += '----\n';
      tmp += constructor.signature + '\n';
      tmp += '----\n';
      tmp += cleanup(constructor.desc) + '\n';

      if (hasValue(constructor.examples)) {
        tmp += generateExamples(constructor.examples);
      }

      if (hasValue(constructor.params)) {
        tmp += generateParameters(constructor.params, structure);
      }

      if (hasValue(constructor.return) && hasValue(constructor.return.types)) {
        tmp += generateReturn(constructor.return, structure);
      }
    });
  }

  return tmp;
};

const buildMethods = (data: Record<string, any>, structure: string): string => {
  let tmp = '';

  if (hasValue(data.methods)) {
    tmp += '\n[[methods]]\n';
    tmp += '== Methods\n';
    data.methods.forEach((method) => {
      tmp += '\n[[' + method.name + ']]\n';
      tmp += '=== ' + method.name + '()\n';
      tmp += '[source, javascript]\n';
      tmp += '----\n';
      tmp += method.signature + '\n';
      tmp += '----\n';
      tmp += cleanup(method.desc) + '\n';

      if (hasValue(method.examples)) {
        tmp += generateExamples(method.examples);
      }

      if (hasValue(method.params)) {
        tmp += generateParameters(method.params, structure);
      }

      if (hasValue(method.return) && hasValue(method.return.types)) {
        tmp += generateReturn(method.return, structure);
      }

      tmp += `\n'''\n`;
    });
  }

  return tmp;
};

const buildEvents = (data: Record<string, any>, structure: string): string => {
  let tmp = '';

  // untested snippet, no events data
  if (hasValue(data.events)) {
    tmp += '\n[[events]]\n';
    tmp += '== Events\n';
    data.events.forEach((event) => {
      tmp += '\n[[' + event.name + ']]\n';
      tmp += '=== ' + event.name + '\n';
      tmp += cleanup(event.desc) + '\n';

      if (hasValue(event.params)) {
        tmp += generateParameters(event.params, structure);
      }
    });
  }

  return tmp;
};

const convert = (pages: PageOutput[][], structure: string): PageOutput[][] => pages.map((page) => {
  // page[0] is json
  // page[1] is adoc
  const data = JSON.parse(page[0].content);
  let tmp = page[1].content;

  // map structure generated by template.js
  // data.datapath = string
  // data.desc = string
  // data.constructors = []
  // data.methods = []
  // data.properties = []
  // data.settings = []
  // data.events = []
  // data.keywords = []
  // data.borrows = data.borrows || []
  // data.examples = data.examples || []

  // description
  if (hasValue(data.desc)) {
    tmp += '\n' + cleanup(data.desc) + '\n';
  }

  // summary if not part of the description
  if (hasValue(data.summary) && (!hasValue(data.desc) || !data.desc.includes(data.summary))) {
    tmp += '\n' + cleanup(data.summary) + '\n';
  }

  // borrows
  // untested snipped, no class extends data
  if (hasValue(data.borrows)) {
    tmp += '\n[[extends]]\n';
    tmp += '== Extends\n';
    data.borrows.forEach((item) => {
      tmp += '\n * ' + generateXref(item, structure) + '\n';
    });
  }

  // examples
  if (hasValue(data.examples)) {
    tmp += '\n[[examples]]\n';
    tmp += '== Examples\n';
    data.examples.forEach((example) => {
      tmp += '[source, javascript]\n';
      tmp += '----\n';
      tmp += example.content + '\n';
      tmp += '----\n';
    });
  }

  tmp += buildSummary(data, structure);
  tmp += buildConstructor(data, structure);
  tmp += buildMethods(data, structure);
  tmp += buildEvents(data, structure);

  // return the applied antora page mutation
  page[1] = {
    ...page[1],
    content: tmp
  };
  return page;
});

export {
  getFilePath,
  generateXref,
  convert
};
