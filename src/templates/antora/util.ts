import * as YAML from 'js-yaml';

import { ExportStructure } from '../../lib/exporter';
import { Type } from '../../lib/type';

interface NavFile {
  readonly title: string;
  readonly path: string;
  readonly pages?: NavFile[];
}

export interface PageOutput {
  readonly type: 'adoc' | 'json' | 'yml';
  readonly filename: string;
  readonly content: string;
}

const BASE_PATH: string = process.env.BASE_PATH || '/_data/antora';

const generateNavPages = (sortedTypes: Type[], structure: ExportStructure): PageOutput[] => {
  const nav = getNavFile(sortedTypes, structure);
  const indexPage = nav[0];
  const adocNav = navToAdoc(indexPage, structure);

  const newNavPages = [] as PageOutput[];
  newNavPages.push({
    type: 'adoc',
    filename: '_data/nav.yml',
    content: YAML.dump(nav)
  });

  newNavPages.push({
    type: 'adoc',
    filename: '_data/moxiedoc_nav.adoc',
    content: adocNav
  });

  switch (structure) {
    case 'legacy':
      return generateIndexPages(newNavPages, indexPage, structure);

    case 'default':
      return newNavPages;
  }
};

const getFilePath = (name: string, structure: ExportStructure): string => {
  const fileName = name.toLowerCase() === 'tinymce' ? getRootPath(structure) : name.toLowerCase();
  switch (structure) {
    case 'legacy':
      const folder = getNamespaceFromFullName(name) + '/';
      return BASE_PATH + '/api/' + folder + '/' + fileName + '.adoc';

    case 'default':
      return BASE_PATH + '/apis/' + fileName + '.adoc';
  }
};

const getJsonFilePath = (type: string, fullName: string): string =>
  (BASE_PATH + '/api/json/' + type + '_' + fullName.replace(/\./g, '_') + '.json').toLowerCase();

const getNavFile = (types: Type[], structure: ExportStructure): NavFile[] => {
  const namespaces = getNamespacesFromTypes(types);
  const pages = Object.entries(namespaces).map(([ url, title ]): NavFile => {
    const innerPages = types.filter((type) => {
      const fullName = type.fullName.toLowerCase();
      return getNamespaceFromFullName(fullName) === url;
    }).map((type): NavFile => {
      return { title: type.fullName, path: type.fullName.toLowerCase() };
    });

    if (url === 'tinymce') {
      innerPages.unshift({
        title: 'tinymce',
        path: getRootPath(structure)
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

const navToAdoc = (indexPage: NavFile, structure: ExportStructure): string => {
  // Api index nav page top level
  let adoc = navLine(indexPage.title, 1);
  if (indexPage.pages) {
    indexPage.pages.forEach((namespace) => {
      adoc += navLine(namespaceLine(namespace, structure), 2);
      if (namespace.pages) {
        namespace.pages.forEach((pageFile) => {
          adoc += navLine(pageFileLine(pageFile, structure), 3);
        });
      }
    });
  }
  return adoc;
};

const generateIndexPages = (newNavPages: PageOutput[], indexPage: NavFile, structure: ExportStructure): PageOutput[] => {
  indexPage.pages.forEach((namespace) => {
    newNavPages.push({
      type: 'adoc',
      filename: BASE_PATH + '/api/' + namespace.path + '/index.adoc',
      content: indexToAdoc(namespace, structure)
    });
  });
  return newNavPages;
};

const indexToAdoc = (namespace: NavFile, structure: ExportStructure): string => {
  let adoc = '= ' + namespace.title + '\n\n';
  adoc += '[cols="1,1"]\n';
  adoc += '|===\n\n';
  if (namespace.pages) {
    namespace.pages.forEach((pageFile) => {
      adoc += 'a|\n';
      adoc += '[.lead]\n';
      adoc += pageFileLine(pageFile, structure) + '\n\n';
    });
  }
  adoc += 'a|\n\n';
  adoc += '|===';
  return adoc;
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

const getRootPath = (structure: ExportStructure): string => {
  switch (structure) {
    case 'legacy':
      return 'root_tinymce';

    case 'default':
      return 'tinymce.root';
  }
};

const namespaceLine = (namespace: NavFile, structure: ExportStructure): string => {
  switch (structure) {
    case 'legacy':
      return generateNavXref('api/' + namespace.path, 'index.adoc', namespace.title);

    case 'default':
      return namespace.title;
  }
};

const pageFileLine = (pageFile: NavFile, structure: ExportStructure): string => {
  switch (structure) {
    case 'legacy':
      return generateNavXref('api/' + getNamespaceFromFullName(pageFile.path), pageFile.path + '.adoc', pageFile.title);

    case 'default':
      return generateNavXref('apis', pageFile.path + '.adoc', pageFile.title);
  }
};

const generateXref = (name: string, structure: ExportStructure): string => {
  const title = getTitleFromFullName(name);
  const fileName = name.toLowerCase() + '.adoc';
  switch (structure) {
    case 'legacy':
      return generateNavXref('api/' + getNamespaceFromFullName(name.toLowerCase()), fileName, title);

    case 'default':
      return generateNavXref('apis/', fileName, title);
  }
};

const generateTypeXref = (type: string, structure: ExportStructure): string => {
  return type.includes('tinymce', 0) ? generateXref(type, structure) : type;
};

const generateNavXref = (basePath: string, filename: string, title: string): string =>
  'xref:' + basePath + '/' + filename + '[' + title + ']';

const getNamespaceFromFullName = (fullName: string): string =>
  fullName === 'tinymce' ? fullName : fullName.split('.').slice(0, -1).join('.');

const getTitleFromFullName = (fullName: string): string =>
  fullName.split('.').slice(-1).join('');

const navLine = (name: string, level: number): string =>
  '*'.repeat(level) + ' ' + name + '\n';

export {
  generateNavPages,
  getFilePath,
  getJsonFilePath,
  generateXref,
  generateTypeXref
};
