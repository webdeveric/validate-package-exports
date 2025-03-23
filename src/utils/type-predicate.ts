/* eslint-disable @typescript-eslint/no-use-before-define */
import { anyOf } from '@webdeveric/utils/predicate/factory/anyOf';
import { everyItem } from '@webdeveric/utils/predicate/factory/everyItem';
import { fromEnum } from '@webdeveric/utils/predicate/factory/fromEnum';
import { literal } from '@webdeveric/utils/predicate/factory/literal';
import { matching } from '@webdeveric/utils/predicate/factory/matching';
import { nullable } from '@webdeveric/utils/predicate/factory/nullable';
import { optional } from '@webdeveric/utils/predicate/factory/optional';
import { shape } from '@webdeveric/utils/predicate/factory/shape';
import { tuple } from '@webdeveric/utils/predicate/factory/tuple';
import { isBoolean } from '@webdeveric/utils/predicate/isBoolean';
import { isObject } from '@webdeveric/utils/predicate/isObject';
import { isOptionalString } from '@webdeveric/utils/predicate/isOptionalString';
import { isString } from '@webdeveric/utils/predicate/isString';
import { isStringArray } from '@webdeveric/utils/predicate/isStringArray';
import { isStringRecord } from '@webdeveric/utils/predicate/isStringRecord';

import {
  logLevelMapping,
  type ConditionalExport,
  type CustomCondition,
  type LogLevelName,
  type ManFile,
  type PackageBrowserRecord,
  type PackageDirectories,
  type PackageJson,
  type RelativePath,
  type SubpathExports,
  type SubpathPattern,
} from '@src/types.js';

export function isRelativePath(input: unknown): input is RelativePath {
  return typeof input === 'string' && input.startsWith('./');
}

export function isLogLevelName(input: unknown): input is LogLevelName {
  return Object.keys(logLevelMapping).includes(String(input));
}

export const isLogLevel = fromEnum(logLevelMapping);

export const isPackageType = anyOf(literal('commonjs'), literal('module'));

export const isOptionalPackageType = optional(isPackageType);

export const isManFile = matching<ManFile>(/\.\d+(\.gz)?$/);

export const isManFileArray = everyItem(isManFile);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#man
 */
export const isPackageMan = anyOf(isManFile, isManFileArray);

export const isOptionalPackageMan = optional(isPackageMan);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#directories
 */
export const isPackageDirectories = shape<PackageDirectories>({
  bin: isOptionalString,
  man: isOptionalString,
});

export const isOptionalPackageDirectories = optional(isPackageDirectories);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
 */
export const isPackageBin = anyOf(isRelativePath, isStringRecord);

export const isOptionalPackageBin = optional(isPackageBin);

export const isSubpathPattern = matching<SubpathPattern>(/^(?<before>\.\/[^*]*)\*(?<after>[^*]*)$/);

export const isExportsEntryPath = nullable(isRelativePath);

export const isCustomCondition = matching<CustomCondition>(/^(?![\\.0-9])./);

export function isConditionalExport(input: unknown): input is ConditionalExport {
  return isObject(input) && everyItem(tuple([isCustomCondition, isAnyExportsEntry]))(Object.entries(input));
}

export function isSubpathExports(input: unknown): input is SubpathExports {
  return (
    isObject(input) && everyItem(tuple([anyOf(literal('.'), isRelativePath), isAnyExportsEntry]))(Object.entries(input))
  );
}

export const isExportsEntry = anyOf(isExportsEntryPath, isConditionalExport);

export const isExportsEntryArray = everyItem(isExportsEntry);

export const isAnyExportsEntry = anyOf(isExportsEntry, isExportsEntryArray);

export const isPackageExports = anyOf(isAnyExportsEntry, isSubpathExports);

export const isOptionalPackageExports = optional(isPackageExports);

export const isPackageBrowserRecord = (input: unknown): input is PackageBrowserRecord => {
  return isObject(input) && everyItem(tuple([isString, anyOf(isString, isBoolean)]))(Object.entries(input));
};

export const isPackageBrowser = anyOf(isString, isPackageBrowserRecord);

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json
 */
export const isPackageJson = shape<PackageJson>({
  name: isString,
  version: isOptionalString,
  main: isOptionalString,
  module: isOptionalString,
  browser: optional(isPackageBrowser),
  types: isOptionalString,
  man: isOptionalPackageMan,
  directories: isOptionalPackageDirectories,
  type: isOptionalPackageType,
  exports: isOptionalPackageExports,
  bin: isOptionalPackageBin,
  files: optional(isStringArray),
});
