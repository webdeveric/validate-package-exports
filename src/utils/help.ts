import { inspect, stripVTControlCharacters } from 'node:util';

import { dedent } from '@webdeveric/utils/dedent';

import { cliArgsConfig } from '@src/arguments.js';
import type { ParseArgsConfigWithDescription } from '@src/types.js';
import type { CliContext } from '@utils/createCliContext.js';
import { hyperlink } from '@utils/terminal.js';

export function optionsOutput(options: ParseArgsConfigWithDescription['options'], indent = 2, gap = 6): string {
  const optionsDetails = Object.entries(options).map(
    ([longOption, descriptor]): [optionFlag: string, description: string] => {
      return [`${'short' in descriptor ? `-${descriptor.short}, ` : ''}--${longOption}`, descriptor.description];
    },
  );

  const longestOptionFlag = optionsDetails.reduce((max, item) => Math.max(max, item[0].length), 0);

  const indentString = ' '.repeat(indent);
  const gapString = ' '.repeat(gap);
  const descriptionIndentString = ' '.repeat(longestOptionFlag + indent + gap);

  return optionsDetails
    .map(
      ([optionFlag, description]) =>
        `${indentString}${optionFlag.padEnd(longestOptionFlag)}${gapString}${description.replaceAll(
          '\n',
          `\n${descriptionIndentString}`,
        )}`,
    )
    .join('\n');
}

export const helpScreen = (cliContext: CliContext): string => {
  const help = dedent`
    Version: ${process.env['npm_package_version']}

    Usage: ${process.env['npm_package_name']} [FILE]... [OPTIONS]
           ${process.env['npm_package_name']} [ -h | --help | -v | --version ]

    Options:

    ${optionsOutput(cliArgsConfig.options)}

    Source code available at ${hyperlink(process.env['homepage']!)}
  `;

  if (cliContext.options.verbose) {
    const helpWidth = stripVTControlCharacters(help)
      .split('\n')
      .reduce((max, item) => Math.max(max, item.length), 0);

    const divider = '─'.repeat(helpWidth);

    const verboseHelp = dedent`
      Context:
        Piping in: ${cliContext.pipingIn}
        Piping out: ${cliContext.pipingOut}
        Options:
          ${inspect(cliContext.options)}
    `;

    return `${help}\n${divider}\n${verboseHelp}`;
  }

  return help;
};
