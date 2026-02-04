import { availableParallelism } from 'node:os';

import { describe, expect, it } from 'vitest';

import type { CliArguments } from '@src/types.js';

import { getCliArguments } from './getCliArguments.js';

describe('getCliArguments()', () => {
  it('Returns CliArguments', () => {
    expect(getCliArguments([])).toEqual({
      bail: process.env.CI === 'true',
      check: false,
      info: process.env.RUNNER_DEBUG === '1',
      json: false,
      concurrency: availableParallelism(),
      packages: ['./package.json'],
    } satisfies CliArguments);

    expect(
      getCliArguments(['./some-path/package.json', '--bail', '--info', '--check', '--json', '--concurrency=1']),
    ).toEqual({
      bail: true,
      check: true,
      info: true,
      json: true,
      concurrency: 1,
      packages: ['./some-path/package.json'],
    } satisfies CliArguments);

    expect(getCliArguments(['--bail', '--no-bail'])).toEqual(
      expect.objectContaining({
        bail: false,
      }),
    );

    expect(getCliArguments(['--info', '--no-info'])).toEqual(
      expect.objectContaining({
        info: false,
      }),
    );
  });

  it('Throws when given incorrect arguments', () => {
    expect(() => {
      getCliArguments(['--not-a-real-flag']);
    }).toThrow();
  });
});
