import type { BinRecord, PackageBin } from '@src/types.js';

export function normalizeBin(bin: PackageBin, name: string): BinRecord {
  return typeof bin === 'string'
    ? {
        [name]: bin,
      }
    : bin;
}
