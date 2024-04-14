/* eslint-disable import/no-extraneous-dependencies */
import { isObject } from '@webdeveric/utils/predicate/isObject';
import { isOptionalString } from '@webdeveric/utils/predicate/isOptionalString';
import { isString } from '@webdeveric/utils/predicate/isString';
import { isStringArray } from '@webdeveric/utils/predicate/isStringArray';
import { isStringRecord } from '@webdeveric/utils/predicate/isStringRecord';
import { createStringMatchingPredicate } from '@webdeveric/utils/predicate-factory/createStringMatchingPredicate';
import { everyItem } from '@webdeveric/utils/predicate-factory/everyItem';
import { maybeUndefined } from '@webdeveric/utils/predicate-factory/maybeUndefined';

import {
  logLevelMapping,
  type AnyExportsEntry,
  type ConditionalExport,
  type CustomCondition,
  type ExportsEntry,
  type ExportsEntryPath,
  type LogLevel,
  type LogLevelName,
  type ManFile,
  type PackageBin,
  type PackageBrowser,
  type PackageBrowserRecord,
  type PackageDirectories,
  type PackageExports,
  type PackageJson,
  type PackageMan,
  type PackageType,
  type RelativePath,
  type SubpathExports,
  type SubpathPattern,
} from '@src/types.js';

export function isLogLevelName(input: unknown): input is LogLevelName {
  return Object.keys(logLevelMapping).includes(String(input));
}

export function isLogLevel(input: unknown): input is LogLevel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values<any>(logLevelMapping).includes(input);
}

export function isPackageType(input: unknown): input is PackageType {
  return input === 'commonjs' || input === 'module';
}

export const isOptionalPackageType = maybeUndefined(isPackageType);

export const isManFile = createStringMatchingPredicate<ManFile>(/\.\d+(\.gz)?$/);

export const isManFileArray = everyItem(isManFile);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#man
 */
export const isPackageMan = (input: unknown): input is PackageMan => isManFile(input) || isManFileArray(input);

export const isOptionalPackageMan = maybeUndefined(isPackageMan);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#directories
 */
export function isPackageDirectories(input: unknown): input is PackageDirectories {
  return isObject(input) && isOptionalString(input.bin) && isOptionalString(input.man);
}

export const isOptionalPackageDirectories = maybeUndefined(isPackageDirectories);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
 */
export function isPackageBin(input: unknown): input is PackageBin {
  return isString(input) || isStringRecord(input);
}

export const isOptionalPackageBin = maybeUndefined(isPackageBin);

export function isRelativePath(input: unknown): input is RelativePath {
  return typeof input === 'string' && input.startsWith('./');
}

export const subpathPattern = /^(?<before>\.\/[^*]*)\*(?<after>[^*]*)$/;

export const isSubpathPattern = createStringMatchingPredicate<SubpathPattern>(subpathPattern);

export function isExportsEntryPath(input: unknown): input is ExportsEntryPath {
  return input === null || isRelativePath(input);
}

export const isCustomCondition = createStringMatchingPredicate<CustomCondition>(/^(?![\\.0-9])./);

export function isConditionalExport(input: unknown): input is ConditionalExport {
  if (isObject(input)) {
    const entries = Object.entries(input);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return entries.every(([key, value]) => isCustomCondition(key) && isAnyExportsEntry(value));
  }

  return false;
}

export function isSubpathExports(input: unknown): input is SubpathExports {
  if (isObject(input)) {
    const entries = Object.entries(input);

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return entries.every(([key, value]) => (key === '.' || isRelativePath(key)) && isAnyExportsEntry(value));
  }

  return false;
}

export function isExportsEntry(input: unknown): input is ExportsEntry {
  return isExportsEntryPath(input) || isConditionalExport(input);
}

export const isExportsEntryArray = everyItem(isExportsEntry);

export function isAnyExportsEntry(input: unknown): input is AnyExportsEntry {
  return isExportsEntry(input) || isExportsEntryArray(input);
}

export function isPackageExports(input: unknown): input is PackageExports {
  return isAnyExportsEntry(input) || isSubpathExports(input);
}

export const isOptionalPackageExports = maybeUndefined(isPackageExports);

export const isPackageBrowserRecord = (input: unknown): input is PackageBrowserRecord => {
  return (
    isObject(input) &&
    Object.entries(input).every(
      entry => typeof entry[0] === 'string' && (typeof entry[1] === 'string' || typeof entry[1] === 'boolean'),
    )
  );
};

export function isPackageBrowser(input: unknown): input is PackageBrowser {
  return isString(input) || isPackageBrowserRecord(input);
}

export const isOptionalPackageBrowser = maybeUndefined(isPackageBrowser);

export const isOptionalStringArray = maybeUndefined(isStringArray);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json
 */
export function isPackageJson(input: unknown): input is PackageJson {
  return (
    isObject(input) &&
    isString(input.name) &&
    isOptionalString(input.version) &&
    isOptionalString(input.main) &&
    isOptionalString(input.module) &&
    isOptionalPackageBrowser(input.browser) &&
    isOptionalString(input.types) &&
    isOptionalPackageMan(input.man) &&
    isOptionalPackageDirectories(input.directories) &&
    isOptionalPackageType(input.type) &&
    isOptionalPackageExports(input.exports) &&
    isOptionalPackageBin(input.bin) &&
    isOptionalStringArray(input.files)
  );
}
