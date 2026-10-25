import { resolve } from 'node:path';
import { ReadableStream, WritableStream } from 'node:stream/web';

import { describe, expect, it } from 'vitest';

import { Result, ResultCode } from '@lib/Result.js';
import type { PackageJson } from '@src/types.js';
import { createEntryPoint } from '@utils/createEntryPoint.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { escapeData, escapeProperty, formatCommand, GithubWritableStream } from './GithubWritableStream.js';

const packageJson: PackageJson = { name: 'test-package', version: '1.0.0', exports: { '.': './index.js' } };

const packageContext = createPackageContext({
  resolvedPath: resolve('/project/package.json'),
  realPath: resolve('/project/package.json'),
  packageJson,
  rawPackageJson: JSON.stringify(packageJson, null, 2),
});

const entryPoint = createEntryPoint({
  modulePath: './index.js',
  subpath: '.',
  itemPath: ['exports', '.'],
  condition: [],
  packageContext,
});

async function collect(results: Result[], info = false): Promise<string[]> {
  const decoder = new TextDecoder();
  let output = '';

  const destination = new WritableStream<Uint8Array>({
    write(chunk) {
      output += decoder.decode(chunk);
    },
  });

  await ReadableStream.from(results).pipeTo(
    new GithubWritableStream({ srcRoot: resolve('/project'), destination, info }),
  );

  return output.split('\n').filter(Boolean);
}

describe('escapeData()', () => {
  it('Escapes percent signs and newlines', () => {
    expect(escapeData('100%\r\n')).toBe('100%25%0D%0A');
  });
});

describe('escapeProperty()', () => {
  it('Also escapes colons and commas', () => {
    expect(escapeProperty('a:b,c')).toBe('a%3Ab%2Cc');
  });
});

describe('formatCommand()', () => {
  it('Omits undefined properties', () => {
    expect(formatCommand('error', { file: 'package.json', line: undefined }, 'Oops')).toBe(
      '::error file=package.json::Oops',
    );
  });

  it('Omits the property list when empty', () => {
    expect(formatCommand('notice', {}, 'Hi')).toBe('::notice::Hi');
  });
});

describe('GithubWritableStream', () => {
  it('Annotates the package.json region of the entry point', async () => {
    const lines = await collect([
      new Result({ name: 'file-exists', code: ResultCode.Error, message: 'File not found', entryPoint }),
    ]);

    expect(lines).toEqual([
      '::error file=package.json,line=5,endLine=5,col=10,endColumn=22,title=file-exists (test-package)::File not found',
    ]);
  });

  it('Includes the error message when it differs', async () => {
    const lines = await collect([
      new Result({
        name: 'unexpected-error',
        code: ResultCode.Error,
        message: 'Something failed',
        error: new Error('Details'),
      }),
    ]);

    expect(lines).toEqual(['::error title=unexpected-error::Something failed%0ADetails']);
  });

  it('Only writes skipped results as notices when info is enabled', async () => {
    const results = [
      new Result({ name: 'require', code: ResultCode.Skip, message: 'Skipped', entryPoint }),
      new Result({ name: 'import', code: ResultCode.Success, message: 'Imported', entryPoint }),
    ];

    expect(await collect(results)).toEqual([]);
    expect(await collect(results, true)).toEqual([
      '::notice file=package.json,line=5,endLine=5,col=10,endColumn=22,title=require (test-package)::Skipped',
    ]);
  });
});
