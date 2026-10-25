import { relative, sep } from 'node:path';
import { WritableStream, type UnderlyingSink } from 'node:stream/web';

import { asError } from '@webdeveric/utils/asError';
import { assertExhaustive } from '@webdeveric/utils/assertion/assertExhaustive';
import { anyOf } from '@webdeveric/utils/predicate/factory/anyOf';
import { tuple } from '@webdeveric/utils/predicate/factory/tuple';
import { isNumber } from '@webdeveric/utils/predicate/isNumber';
import { isString } from '@webdeveric/utils/predicate/isString';

import { ResultCode, type Result } from '@lib/Result.js';
import { getJsonRegion } from '@utils/getJsonRegion.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

export interface GithubWritableStreamOptions {
  /**
   * Annotation file paths are relative to this directory, which should be the repository root.
   */
  srcRoot: string;
  info?: boolean;
  destination?: WritableStream<Uint8Array>;
  highWaterMark?: number;
}

/**
 * @see {@link https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands}
 */
export type WorkflowCommand =
  'debug' | 'notice' | 'warning' | 'error' | 'group' | 'endgroup' | 'add-mask' | 'stop-commands' | 'echo';

export type AnnotationCommand = Extract<WorkflowCommand, 'error' | 'warning' | 'notice'>;

function resultCodeToCommand(code: ResultCode): AnnotationCommand | undefined {
  switch (code) {
    case ResultCode.Success:
      return undefined;
    case ResultCode.Skip:
      return 'notice';
    case ResultCode.Error:
      return 'error';
    default:
      assertExhaustive(code, 'Unhandled ResultCode');
  }
}

/**
 * @see {@link https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts}
 */
export function escapeData(value: string): string {
  return value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

export function escapeProperty(value: string): string {
  return escapeData(value).replaceAll(':', '%3A').replaceAll(',', '%2C');
}

/**
 * Format a workflow command, such as an annotation.
 *
 * @example
 * ```ts
 * formatCommand('error', { file: 'package.json', line: 3 }, 'Oops');
 * // '::error file=package.json,line=3::Oops'
 * ```
 */
export function formatCommand(
  command: WorkflowCommand,
  properties: Record<string, string | number | undefined>,
  message: string,
): string {
  const isPropertiesTuple = tuple([isString, anyOf(isString, isNumber)]);

  const props = Object.entries(properties)
    .filter(isPropertiesTuple)
    .map(([key, value]) => `${key}=${escapeProperty(String(value))}`)
    .join(',');

  return `::${command}${props ? ` ${props}` : ''}::${escapeData(message)}`;
}

/**
 * Writes results as GitHub Actions workflow commands so they show up as annotations on a PR.
 *
 * @see {@link https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands}
 */
export class GithubWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  constructor(options: GithubWritableStreamOptions) {
    const { srcRoot, destination, info = false, highWaterMark = 1 } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    const writeLine = async (line: string): Promise<void> => {
      await writer.write(encoder.encode(line + '\n'));
    };

    super(
      {
        async write(record: Result) {
          const command = resultCodeToCommand(record.code);

          if (!command || (record.code !== ResultCode.Error && !info)) {
            return;
          }

          await writeLine(GithubWritableStream.format(record, command, srcRoot));
        },
        async close() {
          await writer.close();
        },
        async abort(reason?: unknown) {
          await writeLine(
            formatCommand(
              'error',
              { title: 'validate-package-exports' },
              `Validation was aborted before it completed. ${asError(reason).message}`,
            ),
          );

          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.destination = writable;
  }

  static format(result: Result, command: AnnotationCommand, srcRoot: string): string {
    const message =
      result.error && result.error.message !== result.message
        ? `${result.message}\n${result.error.message}`
        : result.message;

    const entryPoint = result.entryPoint;

    if (!entryPoint) {
      return formatCommand(command, { title: result.name }, message);
    }

    // The resolved file is often build output that isn't committed, so annotate the `package.json` that declares it.
    const file = relative(srcRoot, entryPoint.packageContext.path).split(sep).join('/');

    // An empty `itemPath` refers to the whole file, which doesn't need a region.
    const region =
      entryPoint.itemPath.length > 0
        ? getJsonRegion(entryPoint.packageContext.getSource(), entryPoint.itemPath)
        : undefined;

    // GitHub ignores columns on annotations that span multiple lines.
    const singleLine = region && region.startLine === region.endLine;

    return formatCommand(
      command,
      {
        file,
        line: region?.startLine,
        endLine: region?.endLine,
        col: singleLine ? region.startColumn : undefined,
        endColumn: singleLine ? region.endColumn : undefined,
        title: `${result.name} (${entryPoint.moduleName ?? entryPoint.relativePath})`,
      },
      message,
    );
  }
}
