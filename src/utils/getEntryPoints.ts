import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { getEntryPointsFromBin } from './getEntryPointsFromBin.js';
import { getEntryPointsFromBinDirectory } from './getEntryPointsFromBinDirectory.js';
import { getEntryPointsFromBrowser } from './getEntryPointsFromBrowser.js';
import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';
import { getEntryPointsFromMain } from './getEntryPointsFromMain.js';
import { getEntryPointsFromModule } from './getEntryPointsFromModule.js';
import { getEntryPointsFromTypes } from './getEntryPointsFromTypes.js';

export async function* getEntryPoints(
  packageJson: PackageJson,
  packageContext: PackageContext,
): AsyncGenerator<EntryPoint> {
  yield* getEntryPointsFromBin(packageJson, packageContext);
  yield* getEntryPointsFromBinDirectory(packageJson, packageContext);
  yield* getEntryPointsFromBrowser(packageJson, packageContext);
  yield* getEntryPointsFromMain(packageJson, packageContext);
  yield* getEntryPointsFromModule(packageJson, packageContext);
  yield* getEntryPointsFromTypes(packageJson, packageContext);
  yield* getEntryPointsFromExports(packageJson, packageContext);
}
