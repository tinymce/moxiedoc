import { assert } from 'chai';

import { Parser } from '../lib/parser';

describe('Parser', () => {
  const setupParser = () => {
    const data = {
      start: 0,
      tag: 0,
      end: 0,
      startText: null,
      startInfo: null,
      tagName: null,
      tagText: null,
      tagInfo: null
    };

    const parser = new Parser();

    parser.on('start', (text, info) => {
      data.start++;
      data.startText = text;
      data.startInfo = info;
    });

    parser.on('tag', (name, text, info) => {
      data.tag++;
      data.tagName = name;
      data.tagText = text;
      data.tagInfo = info;
    });

    parser.on('end', () => {
      data.end++;
    });

    return { parser, data };
  };

  it('init', () => {
    const parser = new Parser({});

    assert.typeOf(parser, 'object');
    assert.instanceOf(parser, Parser);
  });

  it('parse no doc comments', () => {
    const { parser, data } = setupParser();

    parser.parse('something');

    assert.equal(data.start, 0);
    assert.equal(data.tag, 0);
    assert.equal(data.end, 0);
  });

  it('parse start single line', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* a',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.startText, 'a');
    assert.equal(data.tag, 0);
    assert.equal(data.end, 1);
  });

  it('parse start single line no asterisk', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      ' a',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.startText, 'a');
    assert.equal(data.tag, 0);
    assert.equal(data.end, 1);
  });

  it('parse start multiple lines', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* a',
      '* b',
      '* c',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.startText, 'a\nb\nc');
    assert.equal(data.tag, 0);
    assert.equal(data.end, 1);
    assert.equal(data.startInfo.line, 0);
  });

  it('parse tag single line', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* @a b',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.startText, '');
    assert.equal(data.tagName, 'a');
    assert.equal(data.tagText, 'b');
    assert.equal(data.tag, 1);
    assert.equal(data.end, 1);
    assert.equal(data.tagInfo.line, 1);
  });

  it('parse tag multiple lines', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* @a b',
      '* c',
      '* d',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.tagName, 'a');
    assert.equal(data.tagText, 'b\nc\nd');
    assert.equal(data.tag, 1);
    assert.equal(data.end, 1);
  });

  it('parse tag single line after text', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* text',
      '* @a b',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.tagName, 'a');
    assert.equal(data.tagText, 'b');
    assert.equal(data.tag, 1);
    assert.equal(data.end, 1);
    assert.equal(data.tagInfo.line, 2);
  });

  it('parse start text and tag with events', () => {
    const { parser, data } = setupParser();

    parser.parse([
      '/**',
      '* text',
      '* @a b',
      '*/'
    ].join('\n'));

    assert.equal(data.start, 1);
    assert.equal(data.startText, 'text');
    assert.equal(data.tagName, 'a');
    assert.equal(data.tagText, 'b');
    assert.equal(data.tag, 1);
    assert.equal(data.end, 1);
    assert.equal(data.tagInfo.line, 2);
  });
});