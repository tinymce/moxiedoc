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

/**
 * Utility for organising file structure within the antora template.
 *
 * @class moxiedoc.antora.Util
 */
class Util {
  private structure: ExportStructure;
  private BASE_PATH: string;

  /**
   * Constructs a new Util instance.
   *
   * @param
   * @constructor
   */
  public constructor(structure: ExportStructure) {
    this.structure = structure;
    this.BASE_PATH = process.env.BASE_PATH || '/_data/antora';
  }

  public generateNavPages = (sortedTypes: Type[]): PageOutput[] => {
    const nav = this.getNavFile(sortedTypes);
    const indexPage = nav[0];
    const adocNav = this.navToAdoc(indexPage);

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

    switch (this.structure) {
      case 'legacy':
        return this.generateIndexPages(newNavPages, indexPage);

      case 'default':
        return newNavPages;
    }
  };

  public getFilePath = (name: string): string => {
    const fileName = name.toLowerCase() === 'tinymce' ? this.getRootPath() : name.toLowerCase();
    switch (this.structure) {
      case 'legacy':
        const folder = this.getNamespaceFromFullName(name) + '/';
        return this.BASE_PATH + '/api/' + folder + '/' + fileName + '.adoc';

      case 'default':
        return this.BASE_PATH + '/apis/' + fileName + '.adoc';
    }
  };

  public getJsonFilePath = (type: string, fullName: string): string =>
    (this.BASE_PATH + '/api/' + type + '_' + fullName.replace(/\./g, '_') + '.json').toLowerCase();

  public generateXref = (name: string): string => {
    const title = this.getTitleFromFullName(name);
    return 'xref:' + this.getFilePath(name) + '[' + title + ']';
  };

  public generateTypeXref = (type: string): string => {
    return type.includes('tinymce', 0) ? this.generateXref(type) : type;
  };

  private getNavFile(types: Type[]): NavFile[] {
    const namespaces = this.getNamespacesFromTypes(types);
    const pages = Object.entries(namespaces).map(([ url, title ]): NavFile => {
      const innerPages = types.filter((type) => {
        const fullName = type.fullName.toLowerCase();
        return this.getNamespaceFromFullName(fullName) === url;
      }).map((type): NavFile => {
        return { title: type.fullName, path: type.fullName.toLowerCase() };
      });

      if (url === 'tinymce') {
        innerPages.unshift({
          title: 'tinymce',
          path: this.getRootPath()
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
      path: this.BASE_PATH,
      pages
    }];
  }

  private navToAdoc(indexPage: NavFile): string {
    // Api index nav page top level
    let adoc = this.navLine(indexPage.title, 1);
    if (indexPage.pages) {
      indexPage.pages.forEach((namespace) => {
        adoc += this.navLine(this.namespaceLine(namespace), 2);
        if (namespace.pages) {
          namespace.pages.forEach((pageFile) => {
            adoc += this.navLine(this.pageFileLine(pageFile), 3);
          });
        }
      });
    }
    return adoc;
  }

  private generateIndexPages(newNavPages: PageOutput[], indexPage: NavFile): PageOutput[] {
    indexPage.pages.forEach((namespace) => {
      newNavPages.push({
        type: 'adoc',
        filename: this.BASE_PATH + '/api/' + namespace.path + '/index.adoc',
        content: this.indexToAdoc(namespace)
      });
    });
    return newNavPages;
  }

  private indexToAdoc(namespace: NavFile): string {
    let adoc = '= ' + namespace.title + '\n\n';
    adoc += '[cols="1,1"]\n';
    adoc += '|===\n\n';
    if (namespace.pages) {
      namespace.pages.forEach((pageFile) => {
        adoc += 'a|\n';
        adoc += '[.lead]\n';
        adoc += this.generateNavXref('api/' + this.getNamespaceFromFullName(namespace.path), pageFile.path + '.adoc', pageFile.title) + '\n\n';
      });
    }
    adoc += 'a|\n\n';
    adoc += '|===';
    return adoc;
  }

  private getNamespacesFromTypes(types: Type[]): Record<string, string> {
    return types.reduce((namespaces: Record<string, string>, type: Type) => {
      const fullName = type.fullName.toLowerCase();
      const url = this.getNamespaceFromFullName(fullName);
      if (url && !namespaces[url]) {
        namespaces[url] = this.getNamespaceFromFullName(type.fullName);
      }
      return namespaces;
    }, {});
  }

  private getRootPath(): string {
    switch (this.structure) {
      case 'legacy':
        return 'tinymce.root_tinymce';

      case 'default':
        return 'tinymce.root';
    }
  }

  private namespaceLine(namespace: NavFile): string {
    switch (this.structure) {
      case 'legacy':
        return this.generateNavXref('api/' + namespace.path, 'index.adoc', namespace.title);

      case 'default':
        return namespace.title;
    }
  }

  private pageFileLine(pageFile: NavFile): string {
    switch (this.structure) {
      case 'legacy':
        return this.generateNavXref('api/' + this.getNamespaceFromFullName(pageFile.path), pageFile.path + '.adoc', pageFile.title);

      case 'default':
        return this.generateNavXref('apis', pageFile.path + '.adoc', pageFile.title);
    }
  }

  private getNamespaceFromFullName = (fullName: string): string =>
    fullName.split('.').slice(0, -1).join('.');

  private getTitleFromFullName = (fullName: string): string =>
    fullName.split('.').slice(-1).join('');

  private generateNavXref = (basePath: string, filename: string, title: string): string =>
    'xref:' + basePath + '/' + filename + '[' + title + ']';

  private navLine = (name: string, level: number): string =>
    '*'.repeat(level) + ' ' + name + '\n';
}

export {
  Util
};
