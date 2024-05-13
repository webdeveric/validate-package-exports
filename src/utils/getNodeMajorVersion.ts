import assert from 'node:assert';

export function getNodeMajorVersion(): number {
  const [major] = process.versions.node.split('.');

  assert(major);

  return Number.parseInt(major);
}
