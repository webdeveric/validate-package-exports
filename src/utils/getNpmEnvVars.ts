export function getNpmEnvVars(): Record<`npm_${string}`, string> {
  return Object.fromEntries(
    Object.entries(process.env)
      .filter(
        (entry): entry is [key: `npm_${string}`, value: string] =>
          entry[0].startsWith('npm_') && typeof entry[1] === 'string',
      )
      .sort((left, right) => left[0].localeCompare(right[0])),
  );
}
