import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as YAML from 'js-yaml';
import { ZipWriter } from 'moxie-zip';
import * as path from 'path';

import { Api } from '../../lib/api';
import { Type } from '../../lib/type';

interface NavFile {
  readonly url: string;
  readonly pages?: NavFile[];
}

interface PageOutput {
  readonly filename: string;
  readonly content: string;
}

const namespaceDescriptions = {
  'tinymce': 'Global APIs for working with the editor.',
  'tinymce.dom': 'APIs for working with the DOM from within the editor.',
  'tinymce.editor.ui': 'APIs for registering User Interface components.',
  'tinymce.geom': 'Various rectangle APIs.',
  'tinymce.html': 'APIs for working with HTML within the editor.',
  'tinymce.util': 'Browser related APIs.'
};

const getNamespaceFromFullName = (fullName: string) =>
  fullName.split('.').slice(0, -1).join('.');

const getNamespacesFromTypes = (types: Type[]): string[] => {
  return types.reduce((namespaces: string[], type: Type) => {
    const fullName = type.fullName.toLowerCase();
    const namespace = getNamespaceFromFullName(fullName);
    return namespace && namespaces.indexOf(namespace) === -1 ? namespaces.concat(namespace) : namespaces;
  }, []);
};

/**
 * [getNavFile description]
 * @return {[type]} [description]
 */
const getNavFile = (types: Type[]): NavFile[] => {
  const namespaces = getNamespacesFromTypes(types);
  const pages = namespaces.map((namespace): NavFile => {
    const innerPages = types.filter((type) => {
      const fullName = type.fullName.toLowerCase();
      return getNamespaceFromFullName(fullName) === namespace;
    }).map((type) => ({ url: type.fullName.toLowerCase() }));

    if (namespace === 'tinymce') {
      innerPages.unshift({
        url: 'root_tinymce'
      });
    }

    return {
      url: namespace,
      pages: innerPages
    };
  });

  return [{
    url: 'api',
    pages
  }];
};

/**
 * [description]
 * @param  {[type]} root [description]
 * @param  {[type]} templateDelegate [description]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
const getMemberPages = (root: Api, templateDelegate: HandlebarsTemplateDelegate, type: Type): PageOutput[] => {
  const members = type.getMembers(true);
  const data = type.toJSON();
  data.datapath = data.type + '_' + data.fullName.replace(/\./g, '_').toLowerCase();
  data.desc = data.desc.replace(/\n/g, ' ');

  data.constructors = [];
  data.methods = [];
  data.properties = [];
  data.settings = [];
  data.events = [];
  data.keywords = [];
  data.borrows = data.borrows || [];
  data.examples = data.examples || [];

  members.forEach((member) => {
    const parentType = member.getParentType();

    const memberData = member.toJSON();
    data.keywords.push(member.name);
    memberData.definedBy = parentType.fullName;

    if ('property' === memberData.type) {
      data.properties.push(memberData);
      return;
    }

    if ('setting' === memberData.type) {
      data.settings.push(memberData);
      return;
    }

    if ('constructor' === memberData.type) {
      data.constructors.push(memberData);
      memberData.signature = getSyntaxString(memberData);
      return;
    }

    if ('method' === memberData.type) {
      data.methods.push(memberData);
      memberData.signature = getSyntaxString(memberData);
      return;
    }

    if ('event' === memberData.type) {
      data.events.push(memberData);
      return;
    }
  });

  data.constructors = sortMembers(data.constructors);
  data.methods = sortMembers(data.methods);
  data.properties = sortMembers(data.properties);
  data.settings = sortMembers(data.settings);
  data.events = sortMembers(data.events);
  const keywords = sortMembers(data.keywords);

  data.keywords = keywords.join(' ');

  return [{
    filename: createFileName(data, 'json'),
    content: JSON.stringify(data, null, '  ')
  }, {
    filename: createFileName(data, 'md'),
    content: templateDelegate(data)
  }];
};

/**
 * [sortMembers description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
const sortMembers = <T extends Record<string, any>>(list: T[]): T[] => {
  return list.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });
};

/**
 * [flatten description]
 * @param  {[type]} array [description]
 * @return {[type]}       [description]
 */
const flatten = <T>(array: T[][]): T[] => {
  return ([] as T[]).concat(...array);
};

/**
 * [compileTemplate description]
 * @param  {[type]} filePath [description]
 * @return {[type]}          [description]
 */
const compileTemplate = (filePath: string): HandlebarsTemplateDelegate => {
  return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
};

/**
 * [createFileName description]
 * @param  {[type]} data [description]
 * @param  {[type]} ext [description]
 * @return {[type]}          [description]
 */
const createFileName = (data: Record<string, any>, ext: 'md' | 'json'): string => {
  if ('md' === ext) {
    let namespace = getNamespaceFromFullName(data.fullName);

    if (!namespace) {
      namespace = 'tinymce';
    }

    if (data.fullName === 'tinymce') {
      return ('api/tinymce/root_tinymce.html').toLowerCase();
    }

    return ('api/' + namespace + '/' + data.fullName + '.html').toLowerCase();
  } else {
    return ('_data/api/' + data.type + '_' + data.fullName.replace(/\./g, '_') + '.json').toLowerCase();
  }
};

/**
 * [addPageToArchive description]
 * @param {[type]} page [description]
 */
const addPageToArchive = function (this: ZipWriter, page: { filename: string; content: string }) {
  this.addData(page.filename, page.content);
};

/**
 * [getSyntaxString description]
 * @param  {[type]} memberData [description]
 * @return {[type]}        [description]
 */
const getSyntaxString = (memberData: Record<string, any>) => {
  const params = memberData.params.map((param) => param.name + ':' + param.types[0]).join(', ');

  const returnType = memberData.return ? (':' + memberData.return.types.join(', ')) : '';

  switch (memberData.type) {
    case 'callback':
      return 'function ' + memberData.name + '(' + params + ')' + returnType;

    case 'constructor':
      return 'public constructor function ' + memberData.name + '(' + params + ')' + returnType;

    case 'method':
      return '' + memberData.name + '(' + params + ')' + returnType;

    case 'event':
      return 'public event ' + memberData.name + '(' + params + ')';

    case 'property':
      return 'public ' + memberData.name + ' : ' + memberData.dataTypes.join('/');

    case 'setting':
      return 'public ' + memberData.name + ' : ' + memberData.dataTypes.join('/');
  }
};

/**
 * [function description]
 * @param  {[type]} root   [description]
 * @param  {[type]} toPath [description]
 * @return {[type]}        [description]
 */
const template = (root: Api, toPath: string): void => {
  const archive = new ZipWriter();
  const rootTemplate = compileTemplate('root.handlebars');
  const namespaceTemplate = compileTemplate('namespace.handlebars');
  const memberTemplate = compileTemplate('member.handlebars');

  // bind new archive to function
  const addPage = addPageToArchive.bind(archive);

  // sort types alphabetically
  const sortedTypes: Type[] = root.getTypes().sort((a, b) => {
    if (a.fullName < b.fullName) {
      return -1;
    } else if (a.fullName > b.fullName) {
      return 1;
    } else {
      return 0;
    }
  });

  addPage({
    filename: '_data/nav_api.yml',
    content: YAML.dump(getNavFile(sortedTypes))
  });

  // create all yml and md for each item
  const pages: PageOutput[][] = sortedTypes.map(getMemberPages.bind(null, root, memberTemplate));
  flatten(pages).forEach(addPage);

  getNamespacesFromTypes(sortedTypes).map((namespace) => {
    const fileName = ('api/' + namespace + '/index.html').toLowerCase();
    const namespaceDescription = (namespace in namespaceDescriptions) ? namespaceDescriptions[namespace] : namespace;
    return {
      filename: fileName,
      content: namespaceTemplate({
        title: namespace,
        desc: namespaceDescription
      })
    };
  }).forEach(addPage);

  addPage({
    filename: 'api/index.html',
    content: rootTemplate({})
  });

  archive.saveAs(toPath, (err) => {
    if (err) {
      throw err;
    }
  });
};

export {
  template
};
