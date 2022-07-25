import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { ZipWriter } from 'moxie-zip';
import * as path from 'path';
import { ExportStructure } from 'src/lib/exporter';

import { Api } from '../../lib/api';
import { Type } from '../../lib/type';
import * as AntoraTemplate from './antora.converter';
import { PageOutput } from './util';
import * as Util from './util';

/**
 * [description]
 * @param  {[type]} root [description]
 * @param  {[type]} templateDelegate [description]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
const getMemberPages = (root: Api, templateDelegate: HandlebarsTemplateDelegate, structure: ExportStructure, type: Type): PageOutput[] => {
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

  const jsonFilePath = Util.getJsonFilePath(data.type, data.fullName);
  const adocFilePath = Util.getFilePath(data.fullName, structure);
  return [{
    type: 'json',
    filename: jsonFilePath,
    content: JSON.stringify(data, null, '  ')
  }, {
    type: 'adoc',
    filename: adocFilePath,
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
const addPageToArchive = function (this: ZipWriter, page: PageOutput) {
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
 * @param  {[type]} structure [description]
 * @return {[type]}        [description]
 */
const template = (root: Api, toPath: string, structure: ExportStructure): void => {
  const archive = new ZipWriter();
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

  const navPages = Util.generateNavPages(sortedTypes, structure);

  navPages.forEach((page) => {
    addPage(page);
  });

  // create all json and adoc for each item
  const pages: PageOutput[][] = sortedTypes.map(getMemberPages.bind(null, root, memberTemplate, structure));

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
