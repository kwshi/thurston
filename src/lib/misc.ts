export const adjacentPairs = function* <T>(items: readonly T[]) {
  if (items.length < 2) return;

  for (let i = 0; i < items.length - 1; ++i)
    yield [items[i]!, items[i + 1]!] as const;
  yield [items[items.length - 1]!, items[0]!] as const;
};
