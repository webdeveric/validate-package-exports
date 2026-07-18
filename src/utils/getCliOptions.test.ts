import { availableParallelism } from 'node:os';

import { describe, expect, it } from 'vitest';

import type { CliOptions } from '@src/types.js';

import { getCliOptions } from './getCliOptions.js';

describe('getCliOptions()', () => {
  it('Returns CliOptions', () => {
    expect(getCliOptions([])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: [],
      info: process.env['RUNNER_DEBUG'] === '1',
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./package.json'],
    } satisfies CliOptions);

    expect(getCliOptions(['./some-path/package.json', '--bail', '--info', '--check', '--concurrency=1'])).toEqual({
      bail: true,
      check: true,
      concurrency: 1,
      devCondition: [],
      info: true,
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./some-path/package.json'],
    } satisfies CliOptions);

    expect(getCliOptions(['--bail', '--no-bail'])).toEqual(
      expect.objectContaining({
        bail: false,
      }),
    );

    expect(getCliOptions(['--info', '--no-info'])).toEqual(
      expect.objectContaining({
        info: false,
      }),
    );
  });

  it('--dev-condition flag', () => {
    // Single value
    expect(getCliOptions(['--dev-condition', '@webdeveric/example'])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example'],
      info: process.env['RUNNER_DEBUG'] === '1',
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./package.json'],
    } satisfies CliOptions);

    // Multiple values
    expect(
      getCliOptions(['--dev-condition', '@webdeveric/example1', '--dev-condition', '@webdeveric/example2']),
    ).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./package.json'],
    } satisfies CliOptions);

    // CSV string
    expect(getCliOptions(['--dev-condition', '@webdeveric/example1,@webdeveric/example2'])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./package.json'],
    } satisfies CliOptions);

    // CSV string with whitespace padding
    expect(getCliOptions(['--dev-condition', ' @webdeveric/example1 , @webdeveric/example2 '])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      reporter: 'text',
      verbose: false,
      help: false,
      version: false,
      packages: ['./package.json'],
    } satisfies CliOptions);
  });

  it('Throws when given incorrect arguments', () => {
    expect(() => {
      getCliOptions(['--not-a-real-flag']);
    }).toThrow();
  });
});
