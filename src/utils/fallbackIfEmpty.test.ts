import { describe, expect, it } from 'vitest';

import { fallbackIfEmpty } from './fallbackIfEmpty.js';

async function* asyncFrom<T>(items: T[]): AsyncGenerator<T> {
  yield* items;
}

describe('fallbackIfEmpty()', () => {
  it('Yields items from source when source is not empty', async () => {
    expect(await Array.fromAsync(fallbackIfEmpty(asyncFrom(['a', 'b']), ['fallback']))).toEqual(['a', 'b']);
  });

  it('Yields items from fallback when source is empty', async () => {
    expect(await Array.fromAsync(fallbackIfEmpty(asyncFrom<string>([]), ['fallback']))).toEqual(['fallback']);
  });

  it('Accepts async fallback', async () => {
    expect(await Array.fromAsync(fallbackIfEmpty([], asyncFrom(['fallback'])))).toEqual(['fallback']);
  });
});
