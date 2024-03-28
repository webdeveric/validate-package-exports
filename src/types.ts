import type { UnknownRecord } from '@webdeveric/utils/types/records';

export enum ExitCode {
  Ok = 0,
  Error,
}

export type LogLevelName = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

/**
 * @see https://datatracker.ietf.org/doc/html/rfc5424#page-11
 */
export const enum LogLevel {
  Emergency,
  Alert,
  Critical,
  Error,
  Warning,
  Notice,
  Info,
  Debug,
}

export const logLevelMapping: Record<LogLevelName, LogLevel> = {
  emergency: LogLevel.Emergency,
  alert: LogLevel.Alert,
  critical: LogLevel.Critical,
  error: LogLevel.Error,
  warning: LogLevel.Warning,
  notice: LogLevel.Notice,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
};

export type CliArguments = {
  packages: string[];
  bail: boolean;
  check: boolean;
  verify: boolean;
  concurrency: number;
  json: boolean;
  info: boolean;
};

export type ValidatorOptions = Pick<CliArguments, 'bail' | 'check' | 'verify' | 'concurrency'> & { package: string };

export type MaybeUndefined<Type> = Type extends UnknownRecord
  ? {
      [Property in keyof Type]?: MaybeUndefined<Type[Property]>;
    }
  : Type | undefined;

export type BinRecord = Record<string, RelativePath | string>;

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

export type ExportsEntry = ExportsEntryPath | ConditionalExport;

export type AnyExportsEntry = ExportsEntry | ExportsEntry[];

export type SubpathExports = {
  '.': AnyExportsEntry;
  [subpath: RelativePath | SubpathPattern]: AnyExportsEntry;
};

export type PackageExports = AnyExportsEntry | SubpathExports | ConditionalExport;

export type PackageBrowserRecord = Record<string, string | boolean>;

export type PackageBrowser = string | PackageBrowserRecord;

// https://json.schemastore.org/package.json
// https://cdn.jsdelivr.net/gh/SchemaStore/schemastore/src/schemas/json/package.json
// https://docs.npmjs.com/cli/v10/configuring-npm/package-json
export type PackageJson = {
  name: string;
  version: string;
  type?: PackageType;
  main?: string;
  module?: string;
  browser?: PackageBrowser;
  types?: string;
  typings?: string;
  exports?: PackageExports;
  bin?: PackageBin;
  files?: string[]; // can be globs too
  man?: PackageMan;
  directories?: PackageDirectories;
};

export type ItemPath = (string | number)[];

export type PackageContext = Readonly<{
  name: string;
  type: PackageType;
  path: string;
  directory: string;
}>;

export type EntryPoint = {
  packageContext: PackageContext;
  // bin scripts will not have this
  moduleName: string | undefined; // This is string used with `require` or `import`.
  type: PackageType;
  fileName: string;
  relativePath: string;
  directory: string;
  resolvedPath: string;
  subpath: string | undefined;
  condition: string | undefined;
  itemPath: ItemPath;
};

export type ResolvedEntryPoint = EntryPoint & {
  realResolvedPath: string;
  realDirectory: string;
};
