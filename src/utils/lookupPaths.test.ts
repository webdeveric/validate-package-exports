import { describe, expect, it } from 'vitest';

import { createPackageContext } from '@utils/createPackageContext.js';
import { lookupPaths } from '@utils/lookupPaths.js';

describe('lookupPaths()', () => {
  it('Yields all ancestor directories up to the package root', () => {
    const packageContext = createPackageContext({
      resolvedPath: '/tmp/package/package.json',
      realPath: '/tmp/package/package.json',
      packageJson: { name: 'test-package', version: '1.0.0', type: 'module' },
      rawPackageJson: JSON.stringify({ name: 'test-package', version: '1.0.0', type: 'module' }),
    });

    const paths = Array.from(lookupPaths('/tmp/package/dist/utils/file.js', packageContext));

    expect(paths).toEqual(['/tmp/package/dist/utils', '/tmp/package/dist', '/tmp/package']);
  });
});
