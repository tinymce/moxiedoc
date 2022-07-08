import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as YAML from 'js-yaml';
import { ZipWriter } from 'moxie-zip';
import * as path from 'path';

import { Api } from '../../lib/api';
import { Type } from '../../lib/type';
import * as AntoraTemplate from './antora.converter';

interface NavFile {
  readonly title: string;
  readonly path: string;
  readonly pages?: NavFile[];
}

type PageOutput = AntoraTemplate.PageOutput;

const BASE_PATH = process.env.BASE_PATH || '/_data/antora';

const navLine = (name: string, level: number): string =>
  '*'.repeat(level) + ' ' + name + '\n';

const navToAdoc = (indexPage: NavFile, structure: string, depth: number, level?: number): string => {
  level = level || 1;
  // Api index page top level or blank
  let adoc = level === 1 ? navLine(indexPage.title, level) : '';

  indexPage.pages.forEach((namespace) => {
    adoc += navLine(AntoraTemplate.generateXref(namespace.path, structure), level + 1);
    if (level < depth) {
      adoc += navToAdoc(namespace, structure, depth, level + 1);
    }
  });
  return adoc;
};

const getNamespaceFromFullName = (fullName: string) =>
  fullName.split('.').slice(0, -1).join('.');

const getNamespacesFromTypes = (types: Type[]): Record<string, string> => {
  return types.reduce((namespaces: Record<string, string>, type: Type) => {
    const fullName = type.fullName.toLowerCase();
    const url = getNamespaceFromFullName(fullName);
    if (url && !namespaces[url]) {
      namespaces[url] = getNamespaceFromFullName(type.fullName);
    }
    return namespaces;
  }, {});
};

/**
 * [getNavFile description]
 * @return {[type]} [description]
 */
const getNavFile = (types: Type[], structure: string): NavFile[] => {
  const namespaces = getNamespacesFromTypes(types);
  const pages = Object.entries(namespaces).map(([ url, title ]): NavFile => {
    const innerPages = types.filter((type) => {
      const fullName = type.fullName.toLowerCase();
      return getNamespaceFromFullName(fullName) === url;
    }).map((type): NavFile => {
      return { title: type.fullName, path: type.fullName.toLowerCase() };
    });

    if (url === 'tinymce') {
      const rootPath = structure === 'legacy' ? 'root_tinymce' : 'tinymce.root';
      innerPages.unshift({
        title: 'tinymce',
        path: rootPath
      });
    }

    return {
      title,
      path: url,
      pages: innerPages
    };
  });

  return [{
    title: 'API Reference',
    path: BASE_PATH,
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
  data.summary = data.summary.replace(/\n/g, ' ');

  data.constructors = [];
  data.methods = [];
  data.properties = [];
  data.settings = [];
  data.events = [];
  data.keywords = [];
  data.borrows = data.borrows || [];
  data.examples = data.examples || [];

  // const parents = [data].concat(data.borrows.map(function (parentName) {
  //   return root.getTypes().find(function (type) {
  //     return type.fullName === parentName
  //   }).toJSON()
  // }))

  members.forEach((member) => {
    const parentType = member.getParentType();
    const memberData = member.toJSON();
    data.keywords.push(memberData.name);
    memberData.definedBy = parentType.fullName;

    switch (memberData.type) {
      case 'property':
        data.properties.push(memberData);
        return;

      case 'setting':
        data.settings.push(memberData);
        return;

      case 'constructor':
        data.constructors.push(memberData);
        memberData.signature = getSyntaxString(memberData);
        return;

      case 'method':
        data.methods.push(memberData);
        memberData.signature = getSyntaxString(memberData);
        return;

      case 'event':
        data.events.push(memberData);
        return;
    }
  });

  data.constructors = sortMembers(data.constructors);
  data.methods = sortMembers(data.methods);
  data.properties = sortMembers(data.properties);
  data.settings = sortMembers(data.settings);
  data.events = sortMembers(data.events);
  data.keywords = sortMembers(data.keywords);

  data.keywords = data.keywords.join(', ');
  return [{
    type: 'json',
    filename: ('_data/api/' + data.type + '_' + data.fullName.replace(/\./g, '_') + '.json').toLowerCase(),
    content: JSON.stringify(data, null, '  ')
  }, {
    type: 'adoc',
    filename: AntoraTemplate.getFilePath(root.getStructure())(data.fullName),
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
  const params = memberData.params.map((param) => param.name + ': ' + param.types.join(' | ')).join(', ');
  const returnType = memberData.return ? (': ' + memberData.return.types.join(' | ')) : '';

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
  const memberTemplate = compileTemplate('member.handlebars');
  const structure = root.getStructure();

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

  const nav = getNavFile(sortedTypes, structure);
  const indexPage = nav[0];
  const adocNav = navToAdoc(indexPage, structure, 3);

  addPage({
    filename: '_data/nav.yml',
    content: YAML.dump(nav)
  });

  addPage({
    filename: '_data/moxiedoc_nav.adoc',
    content: adocNav
  });

  if (structure === 'legacy') {
    indexPage.pages.forEach((namespace) => {
      const indexNav = navToAdoc(namespace, structure, 2);
      addPage({
        filename: '_data/' + namespace.title + '_nav.adoc',
        content: indexNav
      });
    });
  }

  // create all json and adoc for each item
  const pages: PageOutput[][] = sortedTypes.map(getMemberPages.bind(null, root, memberTemplate));

  const convertedPages = AntoraTemplate.convert(pages, structure);
  flatten(convertedPages).forEach(addPage);

  archive.saveAs(toPath, (err) => {
    if (err) {
      throw err;
    }
  });
};

export {
  template
};
