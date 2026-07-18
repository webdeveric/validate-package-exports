/**
 * Format a clickable terminal hyperlink using the OSC 8 escape sequence.
 *
 * Falls back to plain text (with the URL in parentheses) when the terminal
 * isn't known to support OSC 8 hyperlinks.
 *
 * @example
 * ```ts
 * hyperlink('https://example.com'); // OSC 8 link, or "https://example.com" as plain text
 * hyperlink('https://example.com', 'Example'); // OSC 8 link, or "Example (https://example.com)" as plain text
 * ```
 */
export function hyperlink(url: string | URL, text?: string): string {
  const supported =
    process.env['TERM_PROGRAM'] === 'iTerm.app' ||
    process.env['TERM_PROGRAM'] === 'Hyper' ||
    process.env['COLORTERM'] === 'truecolor';

  const href = String(url);

  text ||= href;

  if (!supported) {
    return href === text ? href : `${text} (${href})`;
  }

  const ESC = '\x1b';
  const BEL = '\x07';

  return `${ESC}]8;;${url}${BEL}${text}${ESC}]8;;${BEL}`;
}
