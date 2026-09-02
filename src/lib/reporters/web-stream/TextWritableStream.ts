import { WritableStream, type UnderlyingSink } from 'node:stream/web';
import { inspect, styleText } from 'node:util';

import { indent } from '@webdeveric/utils/indent';
import { isStringWithLength } from '@webdeveric/utils/predicate/isStringWithLength';
import { trimIndentation } from '@webdeveric/utils/trimIndentation';
import stringWidth from 'string-width';

import { packageBox } from '@lib/reporters/emoji-icons.js';
import { checkMark, rightArrow, ballotX, downArrow, warning, curvingRightArrow } from '@lib/reporters/text-icons.js';
import { ResultCode, type Result } from '@lib/Result.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

export interface TextWritableStreamOptions {
  info?: boolean;
  verbose?: boolean;
  debug?: boolean;
  destination?: WritableStream<Uint8Array>;
  highWaterMark?: number;
}

export class TextWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  info: boolean;

  verbose: boolean;

  debug: boolean;

  #currentPackage: string | undefined;

  #packageLinePrefix: string;

  #resultLineIndent: string;

  readonly supportsColors: boolean;

  static #iconMap: Record<ResultCode, string> = {
    [ResultCode.Success]: styleText(['greenBright'], checkMark),
    [ResultCode.Error]: styleText(['redBright'], ballotX),
    [ResultCode.Skip]: styleText(['gray'], downArrow),
  };

  constructor(options: TextWritableStreamOptions = {}) {
    const { destination, info = false, verbose = false, debug = false, highWaterMark = 1 } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    super(
      {
        write: async (record: Result) => {
          if (record.code !== ResultCode.Error && !info) {
            return;
          }

          if (
            record.entryPoint?.packageContext.name &&
            record.entryPoint.packageContext.name !== this.#currentPackage
          ) {
            this.#currentPackage = record.entryPoint.packageContext.name;
            const line = this.getPackageLine(record);

            line && (await writer.write(encoder.encode(line + '\n')));
          }

          await writer.write(encoder.encode(this.format(record) + '\n'));
        },
        close: async () => {
          await writer.close();
        },
        abort: async (reason?: unknown) => {
          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.destination = writable;
    this.info = info;
    this.verbose = verbose;
    this.debug = debug;
    this.supportsColors = !destination && process.stdout.isTTY && process.stdout.hasColors();

    this.#packageLinePrefix = `${packageBox} `;
    this.#resultLineIndent = ' '.repeat(stringWidth(this.#packageLinePrefix));
  }

  getIcon(resultCode: ResultCode): string {
    return TextWritableStream.#iconMap[resultCode];
  }

  getPackageLine(result: Result): string | undefined {
    if (result.entryPoint) {
      const { name, version, type } = result.entryPoint.packageContext;

      return `${this.#packageLinePrefix}${name} (${[version ? `v${version}` : styleText(['dim'], 'version missing'), type].join(', ')})`;
    }
  }

  format(result: Result): string {
    const iconPrefix = `${this.getIcon(result.code)} `;
    const prefix = `${iconPrefix}${result.name}: `;

    const errorMessage =
      result.error && result.error.message !== result.message ? `Error: ${result.error.message}` : '';

    if (this.verbose) {
      const extraIndent = ' '.repeat(stringWidth(iconPrefix));

      const lines = [
        `${this.#resultLineIndent}${prefix}${result.message}`,
        result.entryPoint &&
          indent(
            `${curvingRightArrow} ${result.entryPoint.itemPath.length ? result.entryPoint.itemPath.map((item) => `"${item}"`).join(` ${rightArrow} `) : styleText('gray', 'no item path')}`,
            `${this.#resultLineIndent}${extraIndent}`,
          ),
        errorMessage && `${extraIndent}${styleText('red', warning)} ${errorMessage}`,
        this.debug &&
          indent(
            trimIndentation(`
              ${curvingRightArrow} Result
              ${indent(inspect({ ...result }, { colors: this.supportsColors }), extraIndent)}
            `),
            `${this.#resultLineIndent}${extraIndent}`,
          ),
      ];

      return lines.filter(isStringWithLength).join('\n');
    }

    return `${this.#resultLineIndent}${prefix}${result.message} ${errorMessage}`;
  }
}
