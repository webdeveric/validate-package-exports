import { registerHooks, type createRequire } from 'node:module';

let overrideConditions: string[] | undefined;

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, {
      ...context,
      conditions: overrideConditions ? overrideConditions : context.conditions,
    });
  },
});

const withConditions = <T>(conditions: string[] | undefined, callback: () => T): T => {
  overrideConditions = conditions;

  try {
    return callback();
  } finally {
    overrideConditions = undefined;
  }
};

let callId = 0;

/**
 * Resolve a module specifier like `import.meta.resolve()` does, but when `conditions` is
 * given, resolution considers only those conditions instead of whatever the process
 * started with (`default` still applies, since it's an unconditional fallback).
 *
 * @example
 * ```ts
 * importResolveWithConditions('./index.js', import.meta.url, ['development']);
 * ```
 */
export function importResolveWithConditions(specifier: string, parent: string | URL, conditions?: string[]): string {
  const uncachedParent = new URL(parent);

  // Add unique `hash` to `URL` to get around the `import.meta.resolve()` cache.
  uncachedParent.hash = `id-${callId++}`;

  // If the package is symlinked, this will resolve to the real path.
  return withConditions(conditions, () => import.meta.resolve(specifier, uncachedParent));
}

/**
 * Resolve a module specifier like `require.resolve()` does, but when `conditions` is
 * given, resolution considers only those conditions instead of whatever the process
 * started with (`default` still applies, since it's an unconditional fallback).
 *
 * Unlike `import.meta.resolve()`, `require.resolve()` doesn't cache across condition
 * changes, so no cache busting is needed.
 *
 * @example
 * ```ts
 * requireResolveWithConditions(createRequire(import.meta.url), 'some-package', undefined, ['development']);
 * ```
 */
export function requireResolveWithConditions(
  require: ReturnType<typeof createRequire>,
  specifier: string,
  options?: Parameters<typeof require.resolve>[1],
  conditions?: string[],
): string {
  // If the package is symlinked, this will resolve to the real path.
  return withConditions(conditions, () => require.resolve(specifier, options));
}
