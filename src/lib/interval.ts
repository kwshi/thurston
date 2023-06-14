export type Interval = { readonly min: number; readonly max: number };
export type Wall = {
  readonly interval: Interval;
  readonly cross: number | null;
};

export const hull = (values: readonly number[]): Interval | null => {
  if (!values.length) return null;

  let min = values[0]!;
  let max = min;
  for (let i = 1; i < values.length; ++i) {
    const x = values[i]!;
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { min, max } as const;
};

export const carveInterior = (walls: Wall[]): Interval[] => {
  if (!walls.length) return [];
  walls.sort((a, b) => a.interval.min - b.interval.min);

  const spaces: Interval[] = [];
  let left = walls[0]!.interval.max;
  let inside = walls[0]!.cross !== null;
  for (let i = 1; i < walls.length; ++i) {
    const wall = walls[i]!;
    if (wall.interval.min > left && inside)
      spaces.push({ min: left, max: wall.interval.min });
    if (wall.interval.max > left) left = wall.interval.max;
    if (wall.cross !== null) inside = !inside;
  }

  return spaces;
};
