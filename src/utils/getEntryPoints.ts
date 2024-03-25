import type { EntryPoint, PackageJson } from '@src/types.js';

import { getEntryPointsFromBin } from './getEntryPointsFromBin.js';
import { getEntryPointsFromBinDirectory } from './getEntryPointsFromBinDirectory.js';
import { getEntryPointsFromBrowser } from './getEntryPointsFromBrowser.js';
import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';
import { getEntryPointsFromMain } from './getEntryPointsFromMain.js';
import { getEntryPointsFromModule } from './getEntryPointsFromModule.js';
import { getEntryPointsFromTypes } from './getEntryPointsFromTypes.js';

export async function* getEntryPoints(packageJson: PackageJson, packageDirectory: string): AsyncGenerator<EntryPoint> {
  yield* getEntryPointsFromBin(packageJson, packageDirectory);
  yield* getEntryPointsFromBinDirectory(packageJson, packageDirectory);
  yield* getEntryPointsFromBrowser(packageJson, packageDirectory);
  yield* getEntryPointsFromMain(packageJson, packageDirectory);
  yield* getEntryPointsFromModule(packageJson, packageDirectory);
  yield* getEntryPointsFromTypes(packageJson, packageDirectory);
  yield* getEntryPointsFromExports(packageJson, packageDirectory);
}
