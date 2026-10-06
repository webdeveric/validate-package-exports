import { asError } from '@webdeveric/utils/asError';

import { ExportsProcessor } from '@lib/ExportsProcessor.js';
import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { expandEntryPoint } from './expandEntryPoint.js';
import { skipShadowedSubpaths } from './skipShadowedSubpaths.js';

export async function* getEntryPointsFromExports(
  packageJson: PackageJson,
  packageContext: PackageContext,
): AsyncGenerator<EntryPoint | Result> {
  if (packageJson.exports) {
    const processor = new ExportsProcessor();

    const entryPoints = processor.process(
      packageJson.exports,
      {
        itemPath: ['exports'],
      },
      packageContext,
    );

    for (const entryPoint of entryPoints) {
      try {
        yield* skipShadowedSubpaths(expandEntryPoint(entryPoint), processor);
      } catch (error) {
        yield new Result({
          code: ResultCode.Error,
          error: asError(error),
          name: 'entry-point-expansion',
          message: `Unable to expand entry point: ${JSON.stringify(entryPoint.itemPath)}`,
          entryPoint,
        });
      }
    }
  }
}
