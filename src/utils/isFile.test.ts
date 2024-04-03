import { describe, expect, it } from 'vitest';

import { isFile } from './isFile.js';

describe('isFile()', () => {
  it('Returns a boolean', async () => {
    await expect(isFile(import.meta.filename)).resolves.toBeTruthy();
    await expect(isFile('not-a-file')).resolves.toBeFalsy();
  });
});
