import { describe, expect, it } from 'vitest';

import { isReadable } from './isReadable.js';

describe('isReadable()', () => {
  it('Returns a boolean', async () => {
    await expect(isReadable(import.meta.filename)).resolves.toBeTruthy();
    await expect(isReadable('not-a-file')).resolves.toBeFalsy();
  });
});
