export function getDetails(input: object): Record<PropertyKey, unknown> | unknown[] {
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === 'object' ? getDetails(item) : item));
  }

  const entries = Reflect.ownKeys(input).reduce<[PropertyKey, unknown][]>((data, key) => {
    const value = Reflect.get(input, key);

    data.push([key, typeof value === 'object' ? getDetails(value) : value]);

    return data;
  }, []);

  return Object.fromEntries(entries);
}
