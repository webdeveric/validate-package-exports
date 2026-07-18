import { afterEach, describe, expect, it, vi } from 'vitest';

import { isPipedInput, isPipedOutput } from './process.js';

const { fstatSyncMock } = vi.hoisted(() => ({
  fstatSyncMock: vi.fn<(fd: number) => { isFIFO: () => boolean }>(),
}));

vi.mock('node:fs', () => ({
  fstatSync: fstatSyncMock,
}));

describe('isPipedInput()', () => {
  const originalIsTTY = process.stdin.isTTY;

  afterEach(() => {
    process.stdin.isTTY = originalIsTTY;

    fstatSyncMock.mockReset();
  });

  it('Returns false when stdin is a TTY', () => {
    process.stdin.isTTY = true;

    expect(isPipedInput()).toBe(false);
    expect(fstatSyncMock).not.toHaveBeenCalled();
  });

  it('Returns true when stdin is not a TTY and is a FIFO', () => {
    process.stdin.isTTY = false;

    fstatSyncMock.mockReturnValue({ isFIFO: () => true });

    expect(isPipedInput()).toBe(true);
    expect(fstatSyncMock).toHaveBeenCalledWith(0);
  });

  it('Returns false when stdin is not a TTY and is not a FIFO', () => {
    process.stdin.isTTY = false;

    fstatSyncMock.mockReturnValue({ isFIFO: () => false });

    expect(isPipedInput()).toBe(false);
  });

  it('Returns false when stdin is not a TTY and fstatSync throws', () => {
    process.stdin.isTTY = false;

    fstatSyncMock.mockImplementation(() => {
      throw new Error('EBADF');
    });

    expect(isPipedInput()).toBe(false);
  });
});

describe('isPipedOutput()', () => {
  const originalIsTTY = process.stdout.isTTY;

  afterEach(() => {
    process.stdout.isTTY = originalIsTTY;
  });

  it('Returns false when stdout is a TTY', () => {
    process.stdout.isTTY = true;

    expect(isPipedOutput()).toBe(false);
  });

  it('Returns true when stdout is not a TTY', () => {
    process.stdout.isTTY = false;

    expect(isPipedOutput()).toBe(true);
  });
});
