import { ExportsProcessor } from '@lib/ExportsProcessor.js';
import type { EntryPoint, PackageJson } from '@src/types.js';

import { expandEntryPoint } from './expandEntryPoint.js';

export async function* getEntryPointsFromExports(
  packageJson: PackageJson,
  packageDirectory: string,
): AsyncGenerator<EntryPoint> {
  if (packageJson.exports) {
    const entryPoints = new ExportsProcessor().process(packageJson.exports, {
      packageType: packageJson.type ?? 'commonjs',
      packageName: packageJson.name,
      packageDirectory,
      itemPath: ['exports'],
    });

    for (const entryPoint of entryPoints) {
      yield* expandEntryPoint(entryPoint);
    }
  }
}
