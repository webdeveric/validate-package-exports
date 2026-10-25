import type { ItemPath } from '@src/types.js';

/**
 * 1-based line and column numbers, with `endColumn` pointing just past the last character.
 */
export type JsonRegion = {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
};

type Span = {
  start: number;
  end: number;
};

const whitespace = new Set([' ', '\t', '\n', '\r', '\uFEFF']);

const literalTerminators = new Set([...whitespace, ',', ']', '}', '']);

/**
 * Find the region of the value at `path` in a JSON source string.
 *
 * If `path` doesn't fully exist, the region of the deepest existing ancestor is returned.
 * Returns `undefined` if the source isn't valid JSON.
 *
 * @example
 * ```ts
 * getJsonRegion('{\n  "main": "./index.js"\n}', ['main']);
 * // { startLine: 2, endLine: 2, startColumn: 11, endColumn: 23 }
 * ```
 */
export function getJsonRegion(source: string, path: Readonly<ItemPath>): JsonRegion | undefined {
  let pos = 0;

  const fail = (): never => {
    throw new SyntaxError(`Unexpected character at position ${pos}`);
  };

  const skipWhitespace = (): void => {
    while (whitespace.has(source.charAt(pos))) {
      ++pos;
    }
  };

  const consume = (char: string): void => {
    skipWhitespace();

    if (source.charAt(pos) !== char) {
      fail();
    }

    ++pos;
  };

  const skipString = (): Span => {
    skipWhitespace();

    const start = pos;

    consume('"');

    while (pos < source.length && source.charAt(pos) !== '"') {
      pos += source.charAt(pos) === '\\' ? 2 : 1;
    }

    consume('"');

    return { start, end: pos };
  };

  // Scans past comma separated items until `close`, calling `scanItem` for each one.
  const scanItems = (close: string, scanItem: (index: number) => Span | undefined): Span | undefined => {
    let found: Span | undefined;

    skipWhitespace();

    if (source.charAt(pos) === close) {
      ++pos;

      return found;
    }

    for (let index = 0; ; index++) {
      // `scanItem()` must always run to move past the item, even after the target is found.
      const result = scanItem(index);

      found ??= result;

      skipWhitespace();

      if (source.charAt(pos) !== ',') {
        consume(close);

        return found;
      }

      ++pos;
    }
  };

  // Scans past the value at `pos`, returning the target span when this value is on `path`.
  const scanValue = (depth: number, matching: boolean): Span | undefined => {
    skipWhitespace();

    const start = pos;
    const key = path[depth];

    let found: Span | undefined;

    switch (source.charAt(pos)) {
      case '{':
        ++pos;

        found = scanItems('}', () => {
          const keySpan = skipString();
          const name: unknown = JSON.parse(source.slice(keySpan.start, keySpan.end));

          consume(':');

          return scanValue(depth + 1, matching && name === key);
        });

        break;
      case '[':
        ++pos;

        found = scanItems(']', (index) => scanValue(depth + 1, matching && index === key));

        break;
      case '"':
        skipString();

        break;
      default:
        while (!literalTerminators.has(source.charAt(pos))) {
          ++pos;
        }

        if (pos === start) {
          fail();
        }
    }

    return matching ? (found ?? { start, end: pos }) : undefined;
  };

  const toLineColumn = (offset: number): [line: number, column: number] => {
    const before = source.slice(0, offset);

    return [before.split('\n').length, offset - before.lastIndexOf('\n')];
  };

  try {
    const span = scanValue(0, true);

    if (span) {
      const [startLine, startColumn] = toLineColumn(span.start);
      const [endLine, endColumn] = toLineColumn(span.end);

      return {
        startLine,
        endLine,
        startColumn,
        endColumn,
      };
    }
  } catch {
    // ignore parse errors
  }
}
