import { resolve } from 'node:path';

import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';
import { createEntryPoint } from '@utils/createEntryPoint.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { expandEntryPoint } from './expandEntryPoint.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

async function collect(entryPoints: AsyncIterable<EntryPoint>): Promise<EntryPoint[]> {
  const items: EntryPoint[] = [];

  for await (const entryPoint of entryPoints) {
    items.push(entryPoint);
  }

  return items;
}

describe('expandEntryPoint()', () => {
  afterEach(() => {
    vol.reset();
  });

  const packageJson: PackageJson = { name: 'test-package', version: '1.0.0', exports: { './lib/*': './lib/*.js' } };

  const packageContext = createPackageContext({
    resolvedPath: resolve('/project/package.json'),
    realPath: resolve('/project/package.json'),
    packageJson,
    rawPackageJson: JSON.stringify(packageJson),
  });

  const entryPoint = createEntryPoint({
    modulePath: './lib/*.js',
    subpath: './lib/*',
    itemPath: ['exports', './lib/*'],
    condition: ['import'],
    packageContext,
  });

  it('Replaces the star in expanded entry points', async () => {
    vol.fromJSON({
      [resolve('/project/lib/a.js')]: '',
      [resolve('/project/lib/b.js')]: '',
    });

    const expanded = await collect(expandEntryPoint(entryPoint));

    expect(expanded.map(({ moduleName, resolvedPath }) => ({ moduleName, resolvedPath }))).toEqual([
      { moduleName: 'test-package/lib/a', resolvedPath: resolve('/project/lib/a.js') },
      { moduleName: 'test-package/lib/b', resolvedPath: resolve('/project/lib/b.js') },
    ]);
  });

  it('Keeps the packageContext methods on expanded entry points', async () => {
    vol.fromJSON({
      [resolve('/project/lib/a.js')]: '',
    });

    const [expanded] = await collect(expandEntryPoint(entryPoint));

    expect(expanded?.packageContext).toBe(packageContext);
    expect(expanded?.packageContext.getSource()).toBe(JSON.stringify(packageJson));
    expect(expanded?.packageContext.getData()).toBe(packageJson);
  });

  it('Does not share arrays with the original entry point', async () => {
    vol.fromJSON({
      [resolve('/project/lib/a.js')]: '',
    });

    const [expanded] = await collect(expandEntryPoint(entryPoint));

    expect(expanded?.itemPath).toEqual(entryPoint.itemPath);
    expect(expanded?.itemPath).not.toBe(entryPoint.itemPath);
    expect(expanded?.condition).toEqual(entryPoint.condition);
    expect(expanded?.condition).not.toBe(entryPoint.condition);
  });
});
