import { availableParallelism } from 'node:os';

export function parseConcurrency(input: unknown): number {
  const defaultValue = availableParallelism();
  const value = Number.parseInt(`${input}`, 10);

  return Number.isInteger(value) ? Math.max(1, Math.min(value, defaultValue)) : defaultValue;
}
