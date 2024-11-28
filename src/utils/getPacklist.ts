// eslint-disable-next-line import/no-named-as-default
import Arborist from '@npmcli/arborist';
import packlist from 'npm-packlist';

import { fixSlash } from '@utils/fixSlash.js';

export async function getPacklist(directory: string): Promise<string[]> {
  const arborist = new Arborist({ path: directory });
  const tree = await arborist.loadActual();
  const files = await packlist(tree);

  return files.map((file) => fixSlash(file));
}
