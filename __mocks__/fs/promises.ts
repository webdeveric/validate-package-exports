import { fs } from 'memfs';

export default fs.promises;

export const { access, constants, opendir, readFile, realpath, stat } = fs.promises;
