import { sep } from 'node:path';

export function fixSlash(input: string): string {
  return sep === '/' ? input : input.replaceAll('/', sep);
}
