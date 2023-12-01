import { describe, expect, it } from 'vitest';

import {
  isAnyExportsEntry,
  isConditionalExport,
  isCustomCondition,
  isExportsEntry,
  isExportsEntryArray,
  isExportsEntryPath,
  isManFile,
  isOptionalPackageDirectories,
  isOptionalPackageMan,
  isPackageBin,
  isPackageDirectories,
  isPackageExports,
  isPackageJson,
  isPackageMan,
  isPackageType,
  isRelativePath,
  isSubpathExports,
  isSubpathPattern,
} from '@src/type-predicate.js';
import { importJson } from '@src/utils.js';

describe('isPackageType()', () => {
  it('Returns true for valid input', () => {
    expect(isPackageType('module')).toBeTruthy();
    expect(isPackageType('commonjs')).toBeTruthy();
    expect(isPackageType('some other value')).toBeFalsy();
  });
});

describe('isManFile()', () => {
  it('Returns true for valid input', () => {
    expect(isManFile('man.1')).toBeTruthy();
    expect(isManFile('man.1.gz')).toBeTruthy();
    expect(isManFile('some other value')).toBeFalsy();
  });
});

describe('isPackageMan()', () => {
  it('Returns true for valid input', () => {
    expect(isPackageMan('man.1')).toBeTruthy();
    expect(isPackageMan(['man.1.gz', 'man.2.gz'])).toBeTruthy();
    expect(isPackageMan('some other value')).toBeFalsy();
  });
});

describe('isOptionalPackageMan()', () => {
  it('Returns true for valid input', () => {
    expect(isOptionalPackageMan(undefined)).toBeTruthy();
  });
});

describe('isPackageDirectories()', () => {
  it('Returns true for valid input', () => {
    expect(isPackageDirectories({})).toBeTruthy();
    expect(
      isPackageDirectories({
        bin: './bin',
      }),
    ).toBeTruthy();
    expect(
      isPackageDirectories({
        man: './man',
      }),
    ).toBeTruthy();
    expect(
      isPackageDirectories({
        bin: './bin',
        man: './man',
      }),
    ).toBeTruthy();
    expect(isPackageDirectories(undefined)).toBeFalsy();
    expect(isPackageDirectories('some other value')).toBeFalsy();
  });
});

describe('isOptionalPackageDirectories()', () => {
  it('Returns true for valid input', () => {
    expect(isOptionalPackageDirectories(undefined)).toBeTruthy();
  });
});

describe('PackageBin()', () => {
  it('Returns true for valid input', () => {
    expect(isPackageBin('./path/to/bin.js')).toBeTruthy();
    expect(isPackageBin({})).toBeTruthy();
    expect(
      isPackageBin({
        someBin: './someBin.js',
      }),
    ).toBeTruthy();
    expect(isPackageBin(undefined)).toBeFalsy();
  });
});

describe('isRelativePath()', () => {
  it('Returns true for valid input', () => {
    expect(isRelativePath('./path/to/bin.js')).toBeTruthy();
    expect(isRelativePath('/abs/path/to/bin.js')).toBeFalsy();
    expect(isRelativePath(undefined)).toBeFalsy();
  });
});

describe('isSubpathPattern()', () => {
  it('Returns true for valid input', () => {
    expect(isSubpathPattern('./path/*.js')).toBeTruthy();
    expect(isSubpathPattern('./path/to/file.js')).toBeFalsy();
    expect(isSubpathPattern(undefined)).toBeFalsy();
  });
});

describe('isExportsEntryPath()', () => {
  it('Returns true for valid input', () => {
    expect(isExportsEntryPath('./path/to/file.js')).toBeTruthy();
    expect(isExportsEntryPath(null)).toBeTruthy();
  });
});

describe('isCustomCondition()', () => {
  it('Returns true for valid input', () => {
    expect(isCustomCondition('custom-condition')).toBeTruthy();
    expect(isCustomCondition('000-bad-condition')).toBeFalsy();
  });
});

describe('isConditionalExport()', () => {
  it('Returns true for valid input', () => {
    expect(isConditionalExport({})).toBeTruthy();
    expect(
      isConditionalExport({
        import: './path/to/module.mjs',
      }),
    ).toBeTruthy();
    expect(
      isConditionalExport({
        import: {
          types: './path/to/module.d.ts',
          default: './path/to/module.mjs',
        },
      }),
    ).toBeTruthy();
    expect(isConditionalExport(undefined)).toBeFalsy();
  });
});

describe('isExportsEntryArray()', () => {
  it('Returns true for valid input', () => {
    expect(isExportsEntryArray(['./path/to/file.js'])).toBeTruthy();
    expect(isExportsEntryArray(undefined)).toBeFalsy();
  });
});

describe('isAnyExportsEntry()', () => {
  it('Returns true for valid input', () => {
    expect(isAnyExportsEntry(['./path/to/file.js'])).toBeTruthy();
    expect(isAnyExportsEntry('./path/to/file.js')).toBeTruthy();
    expect(isAnyExportsEntry(null)).toBeTruthy();
  });
});

describe('isExportsEntry()', () => {
  it('Returns true for valid input', () => {
    expect(isExportsEntry('./path/*.js')).toBeTruthy();
    expect(isExportsEntry('./path/to/file.js')).toBeTruthy();
    expect(isExportsEntry(undefined)).toBeFalsy();
  });
});

describe('isSubpathExports()', () => {
  it('Returns true for valid input', () => {
    expect(
      isSubpathExports({
        '.': {
          types: './dist/types/index.d.ts',
          require: './dist/cjs/index.js',
          import: './dist/mjs/index.js',
        },
        './*': {
          types: './dist/types/*.d.ts',
          require: './dist/cjs/*.js',
          import: './dist/mjs/*.js',
        },
        './package.json': './package.json',
      }),
    ).toBeTruthy();
    expect(isSubpathExports(undefined)).toBeFalsy();
  });
});

describe('isPackageExports()', () => {
  it('Returns true for valid input', () => {
    expect(isPackageExports({})).toBeTruthy();

    expect(
      isPackageExports({
        './*': {
          require: {
            types: './dist/types/*.d.ts',
            default: './dist/cjs/*.js',
          },
          import: {
            types: './dist/types/*.d.ts',
            default: './dist/mjs/*.js',
          },
        },
        './package.json': './package.json',
      }),
    ).toBeTruthy();

    // NPM's exports: https://registry.npmjs.org/npm/latest
    expect(
      isPackageExports({
        '.': [
          {
            default: './index.js',
          },
          './index.js',
        ],
        './package.json': './package.json',
      }),
    ).toBeTruthy();

    expect(
      isPackageExports({
        bad: 'input',
      }),
    ).toBeFalsy();
    expect(isPackageExports(undefined)).toBeFalsy();
  });
});

describe('isPackageJson()', () => {
  it('Returns true for valid input', () => {
    expect(
      isPackageJson({
        name: 'package-name',
        version: '0.0.0',
      }),
    ).toBeTruthy();
    expect(isPackageJson({})).toBeFalsy();
    expect(isPackageJson(undefined)).toBeFalsy();
  });

  it('Validates own package.json', async () => {
    const packageJson = await importJson('../package.json');

    expect(isPackageJson(packageJson)).toBeTruthy();
  });
});
