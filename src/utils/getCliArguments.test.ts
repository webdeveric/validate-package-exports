import { availableParallelism } from 'node:os';

import { describe, expect, it } from 'vitest';

import type { CliArguments } from '@src/types.js';

import { getCliArguments } from './getCliArguments.js';

describe('getCliArguments()', () => {
  it('Returns CliArguments', () => {
    expect(getCliArguments([])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: [],
      info: process.env['RUNNER_DEBUG'] === '1',
      json: false,
      packages: ['./package.json'],
    } satisfies CliArguments);

    expect(
      getCliArguments(['./some-path/package.json', '--bail', '--info', '--check', '--json', '--concurrency=1']),
    ).toEqual({
      bail: true,
      check: true,
      concurrency: 1,
      devCondition: [],
      info: true,
      json: true,
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

  it('--dev-condition flag', () => {
    // Single value
    expect(getCliArguments(['--dev-condition', '@webdeveric/example'])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example'],
      info: process.env['RUNNER_DEBUG'] === '1',
      json: false,
      packages: ['./package.json'],
    } satisfies CliArguments);

    // Multiple values
    expect(
      getCliArguments(['--dev-condition', '@webdeveric/example1', '--dev-condition', '@webdeveric/example2']),
    ).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      json: false,
      packages: ['./package.json'],
    } satisfies CliArguments);

    // CSV string
    expect(getCliArguments(['--dev-condition', '@webdeveric/example1,@webdeveric/example2'])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      json: false,
      packages: ['./package.json'],
    } satisfies CliArguments);

    // CSV string with whitespace padding
    expect(getCliArguments(['--dev-condition', ' @webdeveric/example1 , @webdeveric/example2 '])).toEqual({
      bail: process.env['CI'] === 'true',
      check: false,
      concurrency: availableParallelism(),
      devCondition: ['@webdeveric/example1', '@webdeveric/example2'],
      info: process.env['RUNNER_DEBUG'] === '1',
      json: false,
      packages: ['./package.json'],
    } satisfies CliArguments);
  });

  it('Throws when given incorrect arguments', () => {
    expect(() => {
      getCliArguments(['--not-a-real-flag']);
    }).toThrow();
  });
});
