import { describe, expect, it } from 'vitest';

import { getJsonRegion } from './getJsonRegion.js';

const source = JSON.stringify(
  {
    name: 'some-package',
    main: './index.js',
    bin: {
      'some-cli': './cli.js',
    },
    exports: {
      '.': {
        import: './index.mjs',
        require: ['./index.cjs', './fallback.cjs'],
      },
      './features/*': './features/*.js',
      './internal': null,
    },
    'quote"key': true,
  },
  null,
  2,
);

describe('getJsonRegion()', () => {
  it('Returns the region of a top level value', () => {
    expect(getJsonRegion(source, ['main'])).toEqual({
      startLine: 3,
      endLine: 3,
      startColumn: 11,
      endColumn: 23,
    });
  });

  it('Returns the region of a nested value', () => {
    expect(getJsonRegion(source, ['bin', 'some-cli'])).toEqual({
      startLine: 5,
      endLine: 5,
      startColumn: 17,
      endColumn: 27,
    });

    expect(getJsonRegion(source, ['exports', '.', 'import'])).toEqual({
      startLine: 9,
      endLine: 9,
      startColumn: 17,
      endColumn: 30,
    });
  });

  it('Returns the region of an array item', () => {
    expect(getJsonRegion(source, ['exports', '.', 'require', 1])).toEqual({
      startLine: 12,
      endLine: 12,
      startColumn: 9,
      endColumn: 25,
    });
  });

  it('Returns the region of an object spanning multiple lines', () => {
    expect(getJsonRegion(source, ['exports', '.'])).toEqual({
      startLine: 8,
      endLine: 14,
      startColumn: 10,
      endColumn: 6,
    });
  });

  it('Returns the region of literals', () => {
    expect(getJsonRegion(source, ['exports', './internal'])).toEqual({
      startLine: 16,
      endLine: 16,
      startColumn: 19,
      endColumn: 23,
    });
  });

  it('Matches keys containing escape sequences', () => {
    expect(getJsonRegion(source, ['quote"key'])).toEqual({
      startLine: 18,
      endLine: 18,
      startColumn: 17,
      endColumn: 21,
    });
  });

  it('Falls back to the deepest existing ancestor', () => {
    expect(getJsonRegion(source, ['exports', '.', 'missing'])).toEqual(getJsonRegion(source, ['exports', '.']));
    expect(getJsonRegion(source, ['exports', '.', 'require', 5])).toEqual(
      getJsonRegion(source, ['exports', '.', 'require']),
    );
  });

  it('Returns the region of the whole document for an empty path', () => {
    expect(getJsonRegion('{}', [])).toEqual({
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 3,
    });
  });

  it('Returns undefined for invalid JSON', () => {
    expect(getJsonRegion('{"main": "./index.js"', ['main'])).toBeUndefined();
    expect(getJsonRegion('{"main" "./index.js"}', ['main'])).toBeUndefined();
    expect(getJsonRegion('', [])).toBeUndefined();
  });
});
