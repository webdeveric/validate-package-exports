import { describe, expect, it, vi } from 'vitest';

import { memo } from './memo.js';

describe('memo', () => {
  it('Memoizes functions', () => {
    const mock = vi.fn((str: string) => str);

    const fn = memo(mock);

    expect(mock).not.toHaveBeenCalled();

    fn('test');

    expect(mock).toHaveBeenCalledTimes(1);

    fn('test');

    expect(mock).toHaveBeenCalledTimes(1);

    fn('test2');

    expect(mock).toHaveBeenCalledTimes(2);
  });
});
