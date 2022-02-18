import { Return } from '../../lib/member';
import { Param } from '../../lib/param';

export interface PageOutput {
  readonly type: 'adoc' | 'json';
  readonly filename: string;
  readonly content: string;
}

// TODO: we can pass this through later
const baseURL = '';

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
  str.replace(/<br\s*\/?>/g, '\n');

// convert <em> into _italics_ asciidoc
const encodeEM = (str: string): string =>
  str.replace(/<\/?em>/g, '_');

// convert <strong> into *bold* asciidoc
const encodeStrong = (str: string): string =>
  str.replace(/<\/?strong>/g, '*');

// convert <code> into backtick asciidoc
const encodeCode = (str: string) => {
  const regex = /<code>(.*?)<\/code>/g;
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

// runs a bunch of required cleanup filters, where embedded code/text can break asciidoc rendering
const cleanup = (str: string): string => {
  const filters = [ escapeComments, encodeBR, encodeEM, encodeStrong, encodeLinks, encodeCode ];
  return filters.reduce((acc, filter) => filter(acc), str);
};

const getNameFromFullName = (name: string): string =>
  name.split('.').slice(-1).join('');

const generateTypeLink = (type: string): string =>
  type.includes('tinymce', 0) ? 'link:' + baseURL + type.toLowerCase() + '.html[' + getNameFromFullName(type) + ']' : type;

const generateDefinedByLink = (definedBy: string) =>
  'link:' + baseURL + definedBy.toLowerCase() + '.html[' + getNameFromFullName(definedBy) + ']';

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

const generateParameters = (params: Param[]): string => {
  let tmp = '\n==== Parameters\n';
  params.forEach((param) => {
    tmp += '\n* `' + param.name + ' (' + param.types.map(generateTypeLink).join(' | ') + ')` - ' + cleanup(param.desc);
  });
  return tmp + '\n';
};

const generateReturn = (ret: Return): string => {
  let tmp = '\n==== Return value\n';
  ret.types.forEach((type) => {
    tmp += '\n* `' + generateTypeLink(type) + '` - ' + cleanup(ret.desc);
  });
  tmp += '\n';
  return tmp;
};

const buildSummary = (data: Record<string, any>): string => {
  let tmp = '';

  // settings
  // untested snippet, no settings data
  if (hasValue(data.settings)) {
    tmp += '\n[[settings]]\n';
    tmp += '=== Settings\n';

    tmp += '[options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Type|Summary|Defined by\n';

    data.settings.forEach((item) => {
      tmp += '|' + item.name;
      tmp += '|`' + generateTypeLink(item.dataTypes[0]) + '`';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateDefinedByLink(item.definedBy) + '`\n';
    });
    tmp += '|===\n';
  }

  // properties
  if (hasValue(data.properties)) {
    tmp += '\n[[properties]]\n';
    tmp += '=== Properties\n';

    tmp += '[options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Type|Summary|Defined by\n';

    data.properties.forEach((item) => {
      tmp += '|' + item.name;
      tmp += '|`' + generateTypeLink(item.dataTypes[0]) + '`';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateDefinedByLink(item.definedBy) + '`\n';
    });
    tmp += '|===\n';
  }

  // constructors
  if (hasValue(data.constructors)) {
    tmp += '\n[[constructors-summary]]\n';
    tmp += '=== Constructors\n';

    tmp += '[options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';

    data.constructors.forEach((item) => {
      tmp += '|link:#' + item.name + '[' + item.name + '()]';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateDefinedByLink(item.definedBy) + '`\n';
    });
    tmp += '|===\n';
  }

  // methods
  if (hasValue(data.methods)) {
    tmp += '\n[[methods-summary]]\n';
    tmp += '=== Methods\n';
    tmp += '[options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';
    data.methods.forEach((item) => {
      tmp += '|link:#' + item.name + '[' + item.name + '()]|' + cleanup(item.desc) + '|`' + generateDefinedByLink(item.definedBy) + '`\n';
    });
    tmp += '|===\n';
  }

  // events
  // untested snippet, no events data
  if (hasValue(data.events)) {
    tmp += '\n[[events-summary]]\n';
    tmp += '=== Events\n';

    tmp += '[options="header"]\n';
    tmp += '|===\n';
    tmp += '|Name|Summary|Defined by\n';

    data.events.forEach((item) => {
      tmp += '|link:#' + item.name + '[' + item.name + ']';
      tmp += '|' + cleanup(item.desc);
      tmp += '|`' + generateDefinedByLink(item.definedBy) + '`\n';
    });
    tmp += '|===\n';
  }

  return tmp.length > 0 ? '\n[[summary]]\n== Summary\n' + tmp : tmp;
};

const buildConstructor = (data: Record<string, any>): string => {
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
        tmp += generateParameters(constructor.params);
      }

      if (hasValue(constructor.return) && hasValue(constructor.return.types)) {
        tmp += generateReturn(constructor.return);
      }
    });
  }

  return tmp;
};

const buildMethods = (data: Record<string, any>): string => {
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
        tmp += generateParameters(method.params);
      }

      if (hasValue(method.return) && hasValue(method.return.types)) {
        tmp += generateReturn(method.return);
      }

      tmp += `\n'''\n`;
    });
  }

  return tmp;
};

const buildEvents = (data: Record<string, any>): string => {
  let tmp = '';

  // untested snippet, no events data
  if (hasValue(data.events)) {
    tmp += '\n[[events]]\n';
    tmp += '== Events\n';
    data.events.forEach((event) => {
      tmp += '\n[[' + event.name + ']]\n';
      tmp += '=== ' + event.name + '()\n';
      tmp += cleanup(event.desc) + '\n';

      if (hasValue(event.params)) {
        tmp += generateParameters(event.params);
      }
    });
  }

  return tmp;
};

const convert = (pages: PageOutput[][]): PageOutput[][] => pages.map((page) => {
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

  // summary
  if (hasValue(data.summary)) {
    tmp += '\n' + cleanup(data.summary) + '\n';
  }

  // borrows
  // untested snipped, no class extends data
  if (hasValue(data.borrows)) {
    tmp += '\n[[extends]]\n';
    tmp += '== Extends\n';
    data.borrows.forEach((item) => {
      tmp += '\n * link:' + baseURL + item.toLowerCase() + '.html[' + item + ']\n';
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

  tmp += buildSummary(data);
  tmp += buildConstructor(data);
  tmp += buildMethods(data);
  tmp += buildEvents(data);

  // return the applied antora page mutation
  page[1] = {
    ...page[1],
    content: tmp
  };
  return page;
});

export {
  convert
};
