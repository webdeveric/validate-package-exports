import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveDirent } from './resolveDirent.js';

describe('resolveDirent()', () => {
  it('Returns a string', () => {
    expect(
      resolveDirent({
        name: 'test.js',
        path: '/tmp',
      }),
    ).toEqual(resolve('/tmp/test.js'));

    expect(
      resolveDirent({
        name: 'test.js',
        path: '/tmp/test.js',
      }),
    ).toEqual(resolve('/tmp/test.js'));
  });
});
