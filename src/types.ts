import type { Task } from '@lib/Task.js';
import type { TaskQueue } from '@lib/TaskQueue.js';

import type { UnknownRecord } from '@webdeveric/utils/types/records';

export enum ExitCodes {
  Ok = 0,
  NotOk = 1,
}

export type ValidatePackageExportsOptions = {
  package: string;
  info: boolean;
  debug: boolean;
};

export type MaybeUndefined<Type> = Type extends UnknownRecord
  ? {
      [Property in keyof Type]?: MaybeUndefined<Type[Property]>;
    }
  : Type | undefined;

export type BinRecord = Record<string, RelativePath>;

export type PackageBin = RelativePath | BinRecord;

export type PackageType = 'commonjs' | 'module';

export type ManFile = `${string}.${number}` | `${string}.${number}.gz`;

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#man
 */
export type PackageMan = ManFile | ManFile[];

/**
 * @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#directories
 */
export type PackageDirectories = {
  bin?: string;
  man?: string;
};

export type RelativePath = `./${string}`;

// https://nodejs.org/api/packages.html#subpath-patterns
export type SubpathPattern = `./${string}*${string}`;

export type NodeConditions = 'node-addons' | 'node' | 'import' | 'require' | 'default';

export type CommunityConditions = 'types' | 'browser' | 'development' | 'production';

export type CommonCondition = NodeConditions | CommunityConditions;

export type CustomCondition = string;

export type ExportsEntryPath = RelativePath | null;

export type ConditionalExport = {
  [Type in CommonCondition]?: AnyExportsEntry;
} & {
  [custom: CustomCondition]: AnyExportsEntry;
};

export type ExportValue = ExportsEntryPath | ConditionalExport;

export type ExportsEntry = ExportsEntryPath | ConditionalExport;

export type AnyExportsEntry = ExportsEntry | ExportsEntry[];

export type SubpathExports = {
  '.': AnyExportsEntry;
  [subpath: RelativePath | SubpathPattern]: AnyExportsEntry;
};

export type PackageExports = AnyExportsEntry | SubpathExports | ConditionalExport;

// https://json.schemastore.org/package.json
// https://cdn.jsdelivr.net/gh/SchemaStore/schemastore/src/schemas/json/package.json
// https://docs.npmjs.com/cli/v10/configuring-npm/package-json
export type PackageJson = {
  name: string;
  version: string;
  type?: PackageType;
  main?: string;
  module?: string;
  browser?: string;
  types?: string;
  exports?: PackageExports;
  bin?: PackageBin;
  files?: string[]; // can be globs too
  man?: PackageMan;
  directories?: PackageDirectories;
};

export enum TaskStatus {
  Pass = 'pass',
  Fail = 'fail',
  Warn = 'warn',
  NoOp = 'noop',
}

export type TaskResult<Context extends UnknownRecord = UnknownRecord> = {
  name: string;
  status: TaskStatus;
  context?: Context;
  debug?: string;
  error?: string;
  success?: string;
};

export type TaskRunContext = {
  packageJson: PackageJson;
  packageDirectory: string;
  queue: TaskQueue;
};

export type TaskFn = (context: TaskRunContext) => TaskResult | Promise<TaskResult>;

export type AnyTask = Task | TaskFn;
