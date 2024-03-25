import { stat } from 'node:fs/promises';

export async function isFile(path: string): Promise<boolean> {
  return (await stat(path)).isFile();
}
