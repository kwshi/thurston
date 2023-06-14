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
