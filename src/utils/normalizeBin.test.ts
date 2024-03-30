import { describe, expect, it } from 'vitest';

import { normalizeBin } from './normalizeBin.js';

describe('normalizeBin()', () => {
  it('Returns an object', () => {
    expect(normalizeBin('./test.js', 'example')).toEqual({
      example: './test.js',
    });

    expect(
      normalizeBin(
        {
          key: './value.js',
        },
        'example',
      ),
    ).toEqual({
      key: './value.js',
    });
  });
});
