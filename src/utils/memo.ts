// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo<Fn extends (...args: any) => any>(fn: Fn): Fn {
  const cache = new Map<Parameters<Fn>[0], ReturnType<Fn>>();

  const memoized = (...args: Parameters<Fn>): ReturnType<Fn> => {
    const cachedValue = cache.get(args[0]);

    if (cachedValue) {
      return cachedValue;
    }

    const value = fn(...args);

    cache.set(args[0], value);

    return value;
  };

  return memoized as Fn;
}
