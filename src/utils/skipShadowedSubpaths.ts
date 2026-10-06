import type { ExportsProcessor } from '@lib/ExportsProcessor.js';
import type { EntryPoint } from '@src/types.js';

import { getConcreteSubpath } from './getConcreteSubpath.js';

/**
 * Skip expanded entry points that Node would resolve using a different subpath key.
 *
 * This covers anything blocked by a more specific `null` subpath, like `"./internal/*": null`,
 * anything that has its own, more specific, subpath key, like `"./internal/index"`,
 * and anything whose own subpath key resolves to `null` for its condition chain, like `[null, "./dist/*.js"]`.
 */
export async function* skipShadowedSubpaths(
  entryPoints: AsyncIterable<EntryPoint>,
  processor: ExportsProcessor,
): AsyncGenerator<EntryPoint> {
  for await (const entryPoint of entryPoints) {
    // Only subpath patterns can be shadowed by another subpath key.
    if (!entryPoint.subpath?.includes('*')) {
      yield entryPoint;

      continue;
    }

    const subpath = getConcreteSubpath(entryPoint);

    if (
      typeof subpath === 'undefined' ||
      (processor.getSubpathKey(subpath) === entryPoint.subpath &&
        !processor.isInternalSubpath(subpath, entryPoint.condition))
    ) {
      yield entryPoint;
    }
  }
}
