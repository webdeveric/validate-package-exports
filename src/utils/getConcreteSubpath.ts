import type { EntryPoint } from '@src/types.js';

/**
 * Get the concrete subpath for an expanded entry point.
 *
 * @example
 * `some-package/internal/utils` produces `./internal/utils`.
 */
export function getConcreteSubpath(entryPoint: EntryPoint): string | undefined {
  const { moduleName, packageContext } = entryPoint;

  if (typeof moduleName === 'undefined') {
    return undefined;
  }

  return moduleName === packageContext.name ? '.' : `.${moduleName.slice(packageContext.name.length)}`;
}
