export type Coordinate = { readonly row: number; readonly column: number };
export type CoordinateMap<T> = Map<number, Map<number, T>>;
export type CoordinateSet = Map<number, Set<number>>;

export const hexagonalPetals = ({
  row,
  column,
}: Coordinate): readonly Coordinate[] => [
  { row, column: column + 1 },
  { row: row + 1, column },
  { row: row + 1, column: column - 1 },
  { row, column: column - 1 },
  { row: row - 1, column },
  { row: row - 1, column: column + 1 },
];

export const setAdd = (s: CoordinateSet, c: Coordinate) => {
  if (!s.has(c.row)) s.set(c.row, new Set());
  s.get(c.row)!.add(c.column);
};

export const setHas = (s: CoordinateSet, c: Coordinate) =>
  s.get(c.row)?.has(c.column) ?? false;

export const setDelete = (s: CoordinateSet, c: Coordinate) =>
  s.get(c.row)?.delete(c.column) ?? false;
