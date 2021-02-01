/* jshint latedef:true */

import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
const ZipWriter = require('moxie-zip').ZipWriter;
const YAML = require('js-yaml');

const BASE_PATH = process.env.BASE_PATH || '/api/';

const namespaceDescriptions = {
  'tinymce': 'Global APIs for working with the editor.',
  'tinymce.dom': 'APIs for working with the DOM from within the editor.',
  'tinymce.editor.ui': 'APIs for registering User Interface components.',
  'tinymce.geom': 'Various rectangle APIs.',
  'tinymce.html': 'APIs for working with HTML within the editor.',
  'tinymce.util': 'Browser related APIs.'
};

/**
 * [function description]
 * @param  {[type]} root   [description]
 * @param  {[type]} toPath [description]
 * @return {[type]}        [description]
 */
const template = function (root: { getTypes: () => string[]; }, toPath: string): Record<string, any> | void {
  const archive = new ZipWriter();
  const rootTemplate = compileTemplate('root.handlebars');
  const namespaceTemplate = compileTemplate('namespace.handlebars');
  const template = compileTemplate('member.handlebars');

  // bind new archive to function
  const addPage = addPageToArchive.bind(archive); // jshint ignore:line

  // sort types alphabetically
  const sortedTypes: string[] = root.getTypes().sort((a: { fullName: string; } | any, b: { fullName: string; } | any): number => {
      if (a.fullName < b.fullName)
        return -1;
      if (a.fullName > b.fullName)
        return 1;
      return 0;
    });

  addPage({
    filename: '_data/nav_api.yml',
    content: YAML.dump(getNavFile(sortedTypes))
  });

  // create all yml and md for each item
  const pages = sortedTypes.map(getMemberPages.bind(null, root, template))
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

  archive.saveAs(toPath, function (err: any) {
    if (err) throw err;
  });
};

function getNamespaceFromFullName(fullName: string) {
  return fullName.split('.').slice(0, -1).join('.');
}

function getNamespacesFromTypes(types: any[]): string[] {
  let namespaces: string[] = [];

  namespaces = types.reduce((namespaces: string | string[], type: { fullName: string; }) => {
      const fullName = type.fullName.toLowerCase();
      const namespace = getNamespaceFromFullName(fullName);
      return namespace && namespaces.indexOf(namespace) === -1 ? namespaces.concat(namespace) : namespaces;
    }, []);

  return namespaces;
}

/**
 * [getNavFile description]
 * @return {[type]} [description]
 */
function getNavFile(types: any[]): any[] {
  const namespaces = getNamespacesFromTypes(types);
  const pages = namespaces.map((namespace) => {
      const innerPages = types.filter((type: { fullName: string; }) => {
          const fullName = type.fullName.toLowerCase();
          return getNamespaceFromFullName(fullName) === namespace;
        }).map((type: { fullName: string; }) => ({ url: type.fullName.toLowerCase() }));

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
    pages: pages
  }];
}

/**
 * [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
function getMemberPages(root: { getTypes: () => any[]; }, template: (arg0: any) => any, data: { getMembers: (arg0: boolean) => any; toJSON: () => any; datapath: string; type: string; fullName: string; desc: string; constructors: any[]; methods: any[]; properties: any[]; settings: any[]; events: any[]; keywords: string[]; borrows: any[]; examples: any[]; }): Record<string, any> {
  const members = data.getMembers(true);
  data = data.toJSON()
  data.datapath = data.type + '_' + data.fullName.replace(/\./g, '_').toLowerCase();
  data.desc = data.desc.replace(/\n/g, ' ');

  data.constructors = []
  data.methods = []
  data.properties = []
  data.settings = []
  data.events = []
  data.keywords = []
  data.borrows = data.borrows || []
  data.examples = data.examples || []

  const parents = [data].concat(data.borrows.map((parentName: string) => root.getTypes().find((type: { fullName: string; }) => type.fullName === parentName).toJSON()))

  members.forEach((member: { getParentType: () => any; toJSON: () => any; name: string; definedBy: string; type: string; signature: string; }) => {
      const parentType = member.getParentType();

      member = member.toJSON();
      data.keywords.push(member.name);
      member.definedBy = parentType.fullName;

      if ('property' === member.type) {
        data.properties.push(member);
        return;
      }

      if ('setting' === member.type) {
        data.settings.push(member);
        return;
      }

      if ('constructor' === member.type) {
        data.constructors.push(member);
        member.signature = getSyntaxString(member);
        return;
      }

      if ('method' === member.type) {
        data.methods.push(member);
        member.signature = getSyntaxString(member);
        return;
      }

      if ('event' === member.type) {
        data.events.push(member);
        return;
      }
    });

  data.constructors = sortMembers(data.constructors)
  data.methods = sortMembers(data.methods)
  data.properties = sortMembers(data.properties)
  data.settings = sortMembers(data.settings)
  data.events = sortMembers(data.events)
  const keywords = sortMembers(data.keywords)

  data.keywords = keywords.join(' ')

  return [{
    filename: createFileName(data, 'json'),
    content: JSON.stringify(data, null, '  ')
  }, {
    filename: createFileName(data, 'md'),
    content: template(data)
  }];
}

/**
 * [sortMembers description]
 * @param  {[type]} list [description]
 * @return {[type]}      [description]
 */
function sortMembers(list: string[]): string[] {
  return list.sort((a: { name: number; } | any, b: { name: number; } | any): number => {
      if (a.name < b.name)
        return -1;
      if (a.name > b.name)
        return 1;
      return 0;
    });
}

/**
 * [flatten description]
 * @param  {[type]} array [description]
 * @return {[type]}       [description]
 */
function flatten<T>(array: T): T {
  return [].concat.apply([], array);
}

/**
 * [compileTemplate description]
 * @param  {[type]} filePath [description]
 * @return {[type]}          [description]
 */
function compileTemplate(filePath: string): HandlebarsTemplateDelegate {
  return Handlebars.compile(fs.readFileSync(path.join(__dirname, filePath)).toString());
}

/**
 * [createFileName description]
 * @param  {[type]} fullName [description]
 * @return {[type]}          [description]
 */
function createFileName(data: { fullName: string; type: string; }, ext: string): string {
  if ('md' === ext) {
    let namespace = getNamespaceFromFullName(data.fullName);

    if (!namespace) {
      namespace = 'tinymce';
    }

    if (data.fullName === 'tinymce') {
      return ('api/tinymce/root_tinymce.html').toLowerCase();
    }

    return ('api/' + namespace + '/' + data.fullName + '.html').toLowerCase();
  } else if ('json' === ext) {
    return ('_data/api/' + data.type + '_' + data.fullName.replace(/\./g, '_') + '.json').toLowerCase();
  }
}

/**
 * [addPageToArchive description]
 * @param {[type]} page [description]
 */
function addPageToArchive(page: { filename: string; content: string; }) {
  this.addData(page.filename, page.content);
}

/**
 * [getSyntaxString description]
 * @param  {[type]} member [description]
 * @return {[type]}        [description]
 */
function getSyntaxString(member: { params: Array<{ name: string; types: string[]; }>; return?: { types: string[]; }; type: string; name: string; dataTypes: string[]; }) {
  let params = member.params.map((param) => param.name + ':' + param.types[0]).join(', ') // Are Params and Param mixed up?

  const returnType = member.return ? (':' + member.return.types.join(', ')) : '';

  switch (member.type) {
    case 'callback':
      return 'function ' + member.name + '(' + params + ')' + returnType;

    case 'constructor':
      return 'public constructor function ' + member.name + '(' + params + ')' + returnType;

    case 'method':
      return '' + member.name + '(' + params + ')' + returnType;

    case 'event':
      return 'public event ' + member.name + '(' + params + ')';

    case 'property':
      return 'public ' + member.name + ' : ' + member.dataTypes.join('/');

    case 'setting':
      return 'public ' + member.name + ' : ' + member.dataTypes.join('/');
  }
}


export {
  template
};