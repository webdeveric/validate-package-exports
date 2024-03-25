import { describe, expect, it } from 'vitest';

import { resolveDirent } from './resolveDirent.js';

describe('resolveDirent()', () => {
  it('Returns a string', () => {
    expect(
      resolveDirent({
        name: 'test.js',
        path: '/tmp',
      }),
    ).toEqual('/tmp/test.js');

    expect(
      resolveDirent({
        name: 'test.js',
        path: '/tmp/test.js',
      }),
    ).toEqual('/tmp/test.js');
  });
});
