import type { Branded } from '@webdeveric/utils/types/branded';
import type { UnknownRecord } from '@webdeveric/utils/types/records';
import type { ParseArgsConfig, ParseArgsOptionDescriptor } from 'node:util';

export type PackageJsonPath = Branded<string, 'package.json'>;

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

export const logLevelMapping = {
  emergency: LogLevel.Emergency,
  alert: LogLevel.Alert,
  critical: LogLevel.Critical,
  error: LogLevel.Error,
  warning: LogLevel.Warning,
  notice: LogLevel.Notice,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
} as const satisfies Record<LogLevelName, LogLevel>;

/**
 * This is basically `ParseArgsConfig`, with a `description` added to the options.
 */
export type ParseArgsConfigWithDescription = Omit<ParseArgsConfig, 'options'> & {
  options: {
    [longOption: string]: ParseArgsOptionDescriptor & { description: string };
  };
};

/**
 * This is the shape of the parsed CLI arguments
 */
export type CliOptions = {
  /**
   * Stop after the first `Error`
   */
  bail: boolean;
  /**
   * Check syntax of js files using `node --check`.
   */
  check: boolean;
  concurrency: number;
  devCondition: string[];
  reporter: 'text' | 'ndjson' | 'json' | 'sarif';
  info: boolean;
  verbose: boolean;
  help: boolean;
  version: boolean;
  /**
   * This will be empty if data is piped in
   */
  packages: string[];
};

export type ValidatorOptions = Omit<CliOptions, 'info' | 'packages'> & {
  package: PackageJsonPath;
  controller: AbortController;
};

export type MaybeUndefined<Type> = Type extends UnknownRecord
  ? {
      [Property in keyof Type]?: MaybeUndefined<Type[Property]>;
    }
  : Type | undefined;

export type BinRecord = Record<string, RelativePath | string>;

export type PackageBin = string | BinRecord;

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
  version?: string;
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
  /**
   * The name from `package.json`
   */
  name: string;
  /**
   * The `type` from `package.json`
   */
  type: PackageType;
  /**
   * Path to the `package.json` file
   */
  path: string;
  /**
   * Real path to the `package.json` file, resolving any symlinks
   */
  realPath: string;
  /**
   * Directory containing the `package.json` file
   */
  directory: string;
  /**
   * Real path to the directory containing the `package.json` file, resolving any symlinks
   */
  realDirectory: string;
}>;

/**
 * EntryPoint _can_ have `*` in the path.
 */
export type EntryPoint = {
  /**
   * This is the string used with `require()` or `import()`.
   *
   * bin scripts will not have this
   */
  moduleName: string | undefined;
  type: PackageType;
  fileName: string;
  relativePath: string;
  directory: string;
  resolvedPath: string;
  subpath: string | undefined;
  /**
   * The chain of nested conditions leading to this entry point,
   * @example
   * `{"node": {"import": "./x.js"}}` produces `["node", "import"]`.
   */
  condition: string[];
  itemPath: ItemPath;
  packageContext: PackageContext;
};

export type JsonStringifyReplacer =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((this: any, key: string, value: any) => any) | (string | number)[] | null | undefined;

export type JsonStringifySpace = Parameters<JSON['stringify']>[2];
