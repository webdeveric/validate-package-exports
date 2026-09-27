import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createPackageContext } from '@utils/createPackageContext.js';
import { lookupPaths } from '@utils/lookupPaths.js';

describe('lookupPaths()', () => {
  it('Yields all ancestor directories up to the package root', () => {
    const packageContext = createPackageContext({
      resolvedPath: resolve('/tmp/package/package.json'),
      realPath: resolve('/tmp/package/package.json'),
      packageJson: { name: 'test-package', version: '1.0.0', type: 'module' },
      rawPackageJson: JSON.stringify({ name: 'test-package', version: '1.0.0', type: 'module' }),
    });

    const paths = Array.from(lookupPaths(resolve('/tmp/package/dist/utils/file.js'), packageContext));

    expect(paths).toEqual([resolve('/tmp/package/dist/utils'), resolve('/tmp/package/dist'), resolve('/tmp/package')]);
  });
});
