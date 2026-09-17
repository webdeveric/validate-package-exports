import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { normalizePackageJsonPath, resolvePackageJson } from './resolvePackageJson.js';

vi.mock('node:fs/promises');

describe('resolvePackageJson()', () => {
  afterEach(() => {
    vol.reset();
  });

  it('Resolves when given the path to a package.json file directly', async () => {
    vol.fromJSON({
      '/project/package.json': '',
    });

    await expect(resolvePackageJson('/project/package.json')).resolves.toBe(
      normalizePackageJsonPath('/project/package.json'),
    );
  });

  it('Resolves package.json inside a given directory', async () => {
    vol.fromJSON({
      '/project/package.json': '',
    });

    await expect(resolvePackageJson('/project')).resolves.toBe(normalizePackageJsonPath('/project/package.json'));
  });

  it('Finds package.json in the same directory as a given non-package.json file', async () => {
    vol.fromJSON({
      '/project/package.json': '',
      '/project/index.js': '',
    });

    await expect(resolvePackageJson('/project/index.js')).resolves.toBe(
      normalizePackageJsonPath('/project/package.json'),
    );
  });

  it('Throws when the path does not exist', async () => {
    vol.fromJSON({
      '/project/package.json': '',
    });

    await expect(resolvePackageJson('/does/not/exist')).rejects.toThrow();
  });
});
