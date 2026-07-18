import { hash } from 'node:crypto';
import { relative, sep } from 'node:path';
import { WritableStream, type UnderlyingSink } from 'node:stream/web';
import { pathToFileURL } from 'node:url';

import { asError } from '@webdeveric/utils/asError';
import { assertExhaustive } from '@webdeveric/utils/assertion';
import { toPascalCase } from '@webdeveric/utils/toPascalCase';

import { ResultCode, type Result, type ResultName } from '@lib/Result.js';
import type { JsonStringifySpace } from '@src/types.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

import type { JsonValue } from '@webdeveric/utils/types';

export interface SarifWritableStreamOptions {
  toolName: string;
  toolVersion: string;
  informationUri: string;
  destination?: WritableStream<Uint8Array>;
  srcRoot: string;
  space?: JsonStringifySpace;
  info?: boolean;
  highWaterMark?: number;
}

type SarifLevel = 'none' | 'note' | 'warning' | 'error';

function resultCodeToSarifLevel(code: ResultCode): SarifLevel {
  switch (code) {
    case ResultCode.Success:
      return 'none';
    case ResultCode.Skip:
      return 'note';
    case ResultCode.Error:
      return 'error';
    default:
      assertExhaustive(code, 'Unhandled ResultCode');
  }
}

type SarifKind = 'pass' | 'fail' | 'notApplicable';

function resultCodeToSarifKind(code: ResultCode): SarifKind {
  switch (code) {
    case ResultCode.Success:
      return 'pass';
    case ResultCode.Skip:
      return 'notApplicable';
    case ResultCode.Error:
      return 'fail';
    default:
      assertExhaustive(code, 'Unhandled ResultCode');
  }
}

// The conditional parameter type resolves to `never` if any `ResultName` is missing from `T`,
// which fails the call below at compile time rather than silently omitting a rule.
function withAllResultNames<const T extends readonly (readonly [ResultName, string])[]>(
  entries: Exclude<ResultName, T[number][0]> extends never ? T : never,
): T {
  return entries;
}

const ruleDescriptions = withAllResultNames([
  ['package-json', 'The package.json "exports" field has the required structure.'],
  ['check-syntax', 'The entry point file has valid JavaScript syntax.'],
  ['file-exists', 'The entry point file exists on disk.'],
  ['require', 'The entry point can be loaded with `require()`.'],
  ['import', 'The entry point can be loaded with `import`.'],
  ['packlist', 'The entry point file will be included when the package is packed.'],
  ['entry-point-expansion', 'Glob patterns used in "exports" can be expanded.'],
  ['unexpected-error', 'No unexpected error occurred while validating.'],
]);

const ruleIds = ruleDescriptions.map(([id]) => id);

interface SarifRule {
  id: ResultName;
  name?: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  help: { text: string };
  helpUri?: string;
  defaultConfiguration: { level: 'warning' };
  properties: { tags: string[] };
}

function buildRules(informationUri: string | undefined): SarifRule[] {
  return ruleDescriptions.map(([id, text]) => {
    const name = toPascalCase(id);

    return {
      id,
      // SARIF 3.49.7: `name` and `id` must differ, or `name` must be omitted.
      ...(name.toLowerCase() !== id.toLowerCase() && { name }),
      shortDescription: {
        text,
      },
      fullDescription: {
        text,
      },
      help: {
        text,
      },
      ...(informationUri && { helpUri: informationUri }),
      defaultConfiguration: {
        level: 'warning',
      },
      properties: {
        tags: ['package.json', 'exports'],
      },
    };
  });
}

/**
 * @see {@link https://sarifweb.azurewebsites.net/}
 */
export class SarifWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  readonly #results: Result[] = [];

  readonly #toolName: string;

  readonly #toolVersion: string | undefined;

  readonly #informationUri: string | undefined;

  constructor(options: SarifWritableStreamOptions) {
    const { toolName, toolVersion, informationUri, destination, info, srcRoot, highWaterMark = 1 } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    const writeJson = async (record: JsonValue): Promise<void> => {
      await writer.write(encoder.encode(JSON.stringify(record, null, 0) + '\n'));
    };

    const writeSarif = async (aborted?: unknown): Promise<void> => {
      const invocation = {
        executionSuccessful: aborted === undefined,
        ...(aborted !== undefined && {
          toolExecutionNotifications: [
            {
              level: 'error',
              message: {
                text: asError(aborted).message,
              },
            },
          ],
        }),
      };

      const sarif = {
        /**
         * Version should come first for version sniffing
         * @see https://github.com/microsoft/sarif-tutorials/blob/main/docs/2-Basics.md#logs-and-runs
         */
        version: '2.1.0',
        $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
        runs: [
          {
            tool: {
              driver: {
                name: this.#toolName,
                version: this.#toolVersion,
                semanticVersion: this.#toolVersion,
                informationUri: this.#informationUri,
                rules: buildRules(this.#informationUri),
              },
            },
            invocations: [invocation],
            automationDetails: {
              id: `${this.#toolName}/`,
            },
            originalUriBaseIds: {
              SRCROOT: {
                uri: pathToFileURL(srcRoot + sep).href,
              },
            },
            results: this.#results.map((result) => {
              const message =
                result.error && result.error.message !== result.message
                  ? `${result.message} ${result.error.message}`
                  : result.message;

              const entryPoint = result.entryPoint;
              const uri = entryPoint && relative(srcRoot, entryPoint.resolvedPath).split(sep).join('/');

              return {
                ruleId: result.name,
                ruleIndex: ruleIds.indexOf(result.name),
                level: resultCodeToSarifLevel(result.code),
                kind: resultCodeToSarifKind(result.code),
                message: {
                  text: message,
                },
                ...(entryPoint && {
                  locations: [
                    {
                      physicalLocation: {
                        artifactLocation: {
                          uri,
                          uriBaseId: 'SRCROOT',
                        },
                      },
                    },
                  ],
                  partialFingerprints: {
                    'validatePackageExports/v1': hash(
                      'sha256',
                      [result.name, uri, entryPoint.moduleName, entryPoint.subpath, entryPoint.itemPath.join('.')].join(
                        '|',
                      ),
                    ),
                  },
                  properties: {
                    packageName: entryPoint.packageContext.name,
                    ...(entryPoint.moduleName && { moduleName: entryPoint.moduleName }),
                    ...(entryPoint.subpath && { subpath: entryPoint.subpath }),
                    ...(entryPoint.condition.length > 0 && { condition: entryPoint.condition }),
                    ...(entryPoint.itemPath.length > 0 && { itemPath: entryPoint.itemPath }),
                  },
                }),
              };
            }),
          },
        ],
      };

      await writeJson(sarif);
    };

    super(
      {
        write: (record: Result) => {
          if (record.code !== ResultCode.Error && !info) {
            return;
          }

          this.#results.push(record);
        },
        close: async () => {
          await writeSarif();

          await writer.close();
        },
        abort: async (reason?: unknown) => {
          await writeSarif(reason ?? new Error('Validation was aborted before it completed.'));

          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.#toolName = toolName;
    this.#toolVersion = toolVersion;
    this.#informationUri = informationUri;
    this.destination = writable;
  }
}
