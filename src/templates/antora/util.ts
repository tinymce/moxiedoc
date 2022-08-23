import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as YAML from 'js-yaml';
import * as path from 'path';

import { ExportStructure } from '../../lib/exporter';
import { Type } from '../../lib/type';

interface NavFile {
  readonly title: string;
  readonly path: string;
  readonly pages?: NavFile[];
}

export interface PageOutput {
  readonly type: 'adoc' | 'json';
  readonly filename: string;
  readonly content: string;
}

const BASE_PATH: string = process.env.BASE_PATH || '/_data/antora';

const namespaceDescriptions = {
  'tinymce': 'Global APIs for working with the editor.',
  'tinymce.dom': 'APIs for working with the DOM from within the editor.',
  'tinymce.editor.ui': 'APIs for registering User Interface components.',
  'tinymce.geom': 'Various rectangle APIs.',
  'tinymce.html': 'APIs for working with HTML within the editor.',
  'tinymce.util': 'Browser related APIs.'
};

/**
 * [compileTemplate description]
 * @param  {[type]} filePath [description]
 * @return {[type]}          [description]
 */
const compileTemplate = (filePath: string): HandlebarsTemplateDelegate => {
  return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
};

const getNamespaceFromFullName = (fullName: string): string =>
  fullName === 'tinymce' ? fullName : fullName.split('.').slice(0, -1).join('.');

const getApiFromFullName = (fullName: string): string =>
  fullName === 'tinymce' ? fullName : fullName.split('.').slice(1).join('.');

const getNameFromFullName = (fullName: string): string =>
  fullName === 'tinymce' ? fullName : fullName.split('.').slice(-1).join('.');

const getTitleFromFullName = (fullName: string): string =>
  fullName.split('.').slice(-1).join('');

const navLine = (name: string, level: number): string =>
  '*'.repeat(level) + ' ' + name + '\n';

const generateNavXref = (basePath: string, filename: string, title: string): string =>
  'xref:' + basePath + '/' + filename + '[' + title + ']';

const generateXref = (name: string, structure: ExportStructure): string => {
  const title = getTitleFromFullName(name);
  const fileName = name.toLowerCase() === 'tinymce' ? getRootPath(structure) : name.toLowerCase();
  switch (structure) {
    case 'legacy':
      return generateNavXref('api/' + getNamespaceFromFullName(name.toLowerCase()), fileName + '.adoc', title);

    case 'default':
      return generateNavXref('apis', fileName + '.adoc', title);
  }
};

const generateTypeXref = (type: string, structure: ExportStructure): string => {
  return type.includes('tinymce', 0) ? generateXref(type, structure) : type;
};

const getJsonFilePath = (type: string, fullName: string): string =>
  ('_data/api/json/' + type + '_' + fullName.replace(/\./g, '_') + '.json').toLowerCase();

const getFilePath = (name: string, structure: ExportStructure): string => {
  const fileName = name.toLowerCase() === 'tinymce' ? getRootPath(structure) : name.toLowerCase();
  switch (structure) {
    case 'legacy':
      const folder = getNamespaceFromFullName(name) + '/';
      return BASE_PATH + '/api/' + folder + '/' + fileName + '.adoc';

    case 'default':
      return BASE_PATH + '/' + fileName + '.adoc';
  }
};

const namespaceNavLine = (namespace: NavFile, structure: ExportStructure): string => {
  switch (structure) {
    case 'legacy':
      return generateNavXref('api/' + namespace.path, 'index.adoc', namespace.title);

    case 'default':
      return namespace.title;
  }
};

const pageFileNavLine = (pageFile: NavFile, structure: ExportStructure): string => {
  const fileName = (pageFile.path === 'tinymce' ? getRootPath(structure) : pageFile.path) + '.adoc';
  switch (structure) {
    case 'legacy':
      const folder = getNamespaceFromFullName(pageFile.path);
      return generateNavXref('api/' + folder, fileName, pageFile.title);

    case 'default':
      return generateNavXref('apis', fileName, pageFile.title);
  }
};

const pageFileLegacyIndexLine = (pageFile: NavFile, structure: ExportStructure): string => {
  const fileName = (pageFile.path === 'tinymce' ? getRootPath(structure) : pageFile.path) + '.adoc';
  const folder = getNamespaceFromFullName(pageFile.path);
  return generateNavXref('api/' + folder, fileName, getNameFromFullName(pageFile.title));
};

const getRootPath = (structure: ExportStructure): string => {
  switch (structure) {
    case 'legacy':
      return 'root_tinymce';

    case 'default':
      return 'tinymce.root';
  }
};

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

const getDescriptionsFromTypes = (types: Type[]): Record<string, string> => {
  return types.reduce((descriptions: Record<string, string>, type: Type) => {
    const name = type.fullName.toLowerCase();
    if (name && !descriptions[name]) {
      descriptions[name] = type.desc;
    }
    return descriptions;
  }, {});
};

const getNavFile = (types: Type[]): NavFile => {
  const namespaces = getNamespacesFromTypes(types);
  const pages = Object.entries(namespaces).map(([ url, title ]): NavFile => {
    const innerPages = types.filter((type) => {
      const fullName = type.fullName.toLowerCase();
      return getNamespaceFromFullName(fullName) === url;
    }).map((type): NavFile => {
      return { title: type.fullName, path: type.fullName.toLowerCase() };
    });

    return {
      title,
      path: url,
      pages: innerPages
    };
  });

  return {
    title: 'API Reference',
    path: BASE_PATH,
    pages
  };
};

const navToAdoc = (indexPage: NavFile, structure: ExportStructure): string => {
  // Api index nav page top level
  let adoc = navLine(indexPage.title, 1);
  if (indexPage.pages) {
    indexPage.pages.forEach((namespace) => {
      adoc += navLine(namespaceNavLine(namespace, structure), 2);
      if (namespace.pages) {
        namespace.pages.forEach((pageFile) => {
          adoc += navLine(pageFileNavLine(pageFile, structure), 3);
        });
      }
    });
  }
  return adoc;
};

const generateNavPages = (indexPage: NavFile, structure: ExportStructure): PageOutput[] => {
  const navPages = [] as PageOutput[];
  navPages.push({
    type: 'adoc',
    filename: '_data/nav.yml',
    content: YAML.dump(indexPage)
  });

  const adocNav = navToAdoc(indexPage, structure);
  navPages.push({
    type: 'adoc',
    filename: '_data/moxiedoc_nav.adoc',
    content: adocNav
  });
  return navPages;
};

const legacyIndexToAdoc = (
  namespace: NavFile,
  template: HandlebarsTemplateDelegate,
  descriptions: Record<string, string>,
  structure: ExportStructure
): string => {
  const keywords = [ getApiFromFullName(namespace.title) ];
  const indexPageLines = [
    '\n== ' + namespaceDescriptions[namespace.title.toLowerCase()] + '\n\n'
  ];
  if (namespace.pages) {
    indexPageLines.push(
      '[cols="1,1"]\n',
      '|===\n\n'
    );
    namespace.pages.forEach((pageFile) => {
      keywords.push(getNameFromFullName(pageFile.title));
      indexPageLines.push('a|\n');
      indexPageLines.push('[.lead]\n');
      indexPageLines.push(pageFileLegacyIndexLine(pageFile, structure) + '\n\n');
      const description = descriptions[pageFile.path];
      indexPageLines.push(description + '\n\n');
    });
    if (namespace.pages.length % 2 !== 0) {
      indexPageLines.push('a|\n');
    }
    indexPageLines.push('|===\n');
  }
  const data = {
    fullName: namespace.title,
    desc: namespaceDescriptions[namespace.title.toLowerCase()],
    keywords: keywords.join(', ')
  };
  const adoc = template(data) + indexPageLines.join('');
  return adoc;
};

const generateLegacyIndexPages = (
  indexPage: NavFile,
  sortedTypes: Type[],
  memberTemplate: HandlebarsTemplateDelegate,
  structure: ExportStructure
): PageOutput[] => {
  const newNavPages = [] as PageOutput[];
  const descriptions = getDescriptionsFromTypes(sortedTypes);
  indexPage.pages.forEach((namespace) =>
    newNavPages.push({
      type: 'adoc',
      filename: BASE_PATH + '/api/' + namespace.path + '/index.adoc',
      content: legacyIndexToAdoc(namespace, memberTemplate, descriptions, structure)
    })
  );
  return newNavPages;
};

export {
  compileTemplate,
  getNavFile,
  generateNavPages,
  generateLegacyIndexPages,
  getFilePath,
  getJsonFilePath,
  generateXref,
  generateTypeXref
};
