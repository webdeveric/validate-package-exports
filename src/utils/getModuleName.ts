export function getModuleName(packageName: string, subpath: string): string {
  return subpath === '.' ? packageName : `${packageName}/${subpath.replace(/^\.\//, '')}`;
}
