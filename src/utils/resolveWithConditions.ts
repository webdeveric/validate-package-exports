import { registerHooks } from 'node:module';

let overrideConditions: string[] | undefined;

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier, {
      ...context,
      conditions: overrideConditions ? overrideConditions : context.conditions,
    });
  },
});

let callId = 0;

/**
 * Resolve a module specifier like `import.meta.resolve()` does, but when `conditions` is
 * given, resolution considers only those conditions instead of whatever the process
 * started with (`default` still applies, since it's an unconditional fallback).
 *
 * @example
 * resolveWithConditions('./index.js', import.meta.url, ['development']);
 */
export function resolveWithConditions(specifier: string, parent: string | URL, conditions?: string[]): string {
  overrideConditions = conditions;

  // `import.meta.resolve()` caches its result by (specifier, parent) and ignores that
  // a hook can return a different URL for the same pair on a later call, so a unique
  // fragment is added to `parent` to force a fresh resolution every time.
  const uncachedParent = new URL(parent);

  uncachedParent.hash = `resolveWithConditions-${callId++}`;

  try {
    // If the package is symlinked, this will resolve to the real path.
    return import.meta.resolve(specifier, uncachedParent);
  } finally {
    overrideConditions = undefined;
  }
}
