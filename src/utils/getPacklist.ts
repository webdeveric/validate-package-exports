import { fixSlash } from './fixSlash.js';

export async function getPacklist(directory: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const Arborist = (await import('@npmcli/arborist')).default;
  const packlist = (await import('npm-packlist')).default;

  const arborist = new Arborist({ path: directory });
  const tree = await arborist.loadActual();
  const files = await packlist(tree);

  return files.map(file => fixSlash(file));
}
