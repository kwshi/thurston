import * as Complex from "$lib/complex";
import * as Graph from "$lib/graph";
import * as Misc from "$lib/misc";
import * as Lattice from "$lib/lattice";
import type * as Label from "$lib/label";
import * as Segment from "$lib/segment";
import * as Interval from "$lib/interval";

type Interval = { readonly min: number; readonly max: number };
type Wall = { readonly interval: Interval; readonly cross: number | null };

export const hexagonalFit = (
  points: Complex.Complex[],
  radius: number
): Map<number, Set<number>> => {
  const rowHeight = Math.sqrt(3) * radius;
  const wallRows = new Map<number, Wall[]>();
  for (const [z1, z2] of Misc.adjacentPairs(points)) {
    const rMin = Math.floor((Math.min(z1.y, z2.y) - radius) / rowHeight);
    const rMax = Math.floor((Math.max(z1.y, z2.y) + radius) / rowHeight);
    for (let r = rMin + 1; r <= rMax; ++r) {
      const y = r * rowHeight;
      const interval = Segment.thickIntersect([z1, z2], radius, y);

      if (!wallRows.has(r)) wallRows.set(r, []);
      if (interval) wallRows.get(r)!.push(interval);
    }
  }

  const coordinates = new Map<number, Set<number>>();
  for (const [r, row] of wallRows.entries()) {
    const columns = new Set<number>();
    for (const interval of Interval.carveInterior(row)) {
      const left = Math.ceil((interval.min / radius - r) / 2);
      const right = Math.floor((interval.max / radius - r) / 2);
      for (let j = left; j <= right; ++j) columns.add(j);
    }
    coordinates.set(r, columns);
  }
  return coordinates;
};

export const cutThick = (points: Complex.Complex[], radius: number) => {
  const coordinates = hexagonalFit(points, radius);

  const nodes: Lattice.CoordinateMap<
    Graph.NodeUnresolved<Label.Full, Lattice.Coordinate>
  > = new Map();

  const rowHeight = radius * Math.sqrt(3);
  for (const [row, columns] of coordinates.entries()) {
    const nodeColumns = new Map<
      number,
      Graph.NodeUnresolved<Label.Full, Lattice.Coordinate>
    >();
    for (const column of columns) {
      const petals = Lattice.hexagonalPetals({ row, column });
      nodeColumns.set(column, {
        id: Symbol(),
        label: {
          data: { row, column },
          position: Complex.complex(
            (row + 2 * column) * radius,
            row * rowHeight
          ),
          radius,
        },
        petals: petals.every((key) => coordinates.get(key.row)?.has(key.column))
          ? [...petals]
          : null,
      });
    }
    nodes.set(row, nodeColumns);
  }

  return Graph.resolveLazy((key) => nodes.get(key.row)?.get(key.column), {
    row: 0,
    column: 0,
  });
};

/*
  old code, may still be useful

export const findIntercepts = (points: Complex.Complex[], step: number) => {
  const rows = new Map<number, number[]>();
  for (const [z1, z2] of Misc.adjacentPairs(points)) {
    const r1 = z1.y / step;
    const r2 = z2.y / step;
    const rMin = Math.floor(Math.min(r1, r2));
    const rMax = Math.floor(Math.max(r1, r2));
    for (let r = rMin + 1; r <= rMax; ++r) {
      const y = r * step;
      const x = z1.x + ((z2.x - z1.x) * (y - z1.y)) / (z2.y - z1.y);

      if (!rows.has(r)) rows.set(r, []);
      rows.get(r)!.push(x);
    }
  }
  for (const row of rows.values()) row.sort((a, b) => a - b);
  return rows;
};

export const cut = (points: Complex.Complex[], radius: number) => {
  const stuff: Complex.Complex[] = [];

  const rowHeight = Math.sqrt(3) * radius;
  const rows = findIntercepts(points, rowHeight);
  console.log(rows);
  for (const [r, row] of rows.entries()) {
    const y = r * rowHeight;
    for (let i = 0; i + 1 < row.length; i += 2) {
      const left = Math.ceil((row[i]! / radius - r + 1) / 2);
      const right = Math.floor((row[i + 1]! / radius - r - 1) / 2);
      for (let j = left; j <= right; ++j) {
        stuff.push(Complex.complex((r + 2 * j) * radius, y));
      }
    }
  }

  return stuff;

  //const graph: Graph.GraphUnresolved<
  //  Graph.Label.Position &
  //    Graph.Label.Radius &
  //    Graph.Label.Data<{ row: number; column: number }>
  //> = new Map();
};
*/
