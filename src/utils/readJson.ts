import { readFile } from 'node:fs/promises';

export async function readJson(path: string): Promise<unknown> {
  const contents = await readFile(path, 'utf-8');

  return JSON.parse(contents);
}
