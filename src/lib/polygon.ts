import * as Complex from "$lib/complex";
import * as Graph from "$lib/graph";
import * as Misc from "$lib/misc";
import * as Lattice from "$lib/lattice";
import type * as Label from "$lib/label";
import * as Segment from "$lib/segment";
import * as Interval from "$lib/interval";

export type Polygon = readonly Complex.Complex[];

export const sector = (
  [center, endpoint]: Segment.Segment,
  angle: number,
  n: number
): Polygon => {
  const points: Complex.Complex[] = [center, endpoint];
  const ray = Complex.sub(endpoint, center);
  for (let i = 1; i <= n; ++i)
    points.push(
      Complex.add(center, Complex.mul(ray, Complex.polar(1, (i / n) * angle)))
    );
  return points;
};

export const rectangle = ([z, w]: Segment.Segment): Polygon => [
  z,
  Complex.complex(z.x, w.y),
  w,
  Complex.complex(w.x, z.y),
];

export const toPathD = (polygon: Polygon, close = true) => {
  const first = polygon[0];
  if (!first) return "";

  const moves: string[] = [`M${first.x} ${first.y}`];
  for (let i = 1; i < polygon.length; ++i) {
    const z = polygon[i]!;
    moves.push(`L${z.x} ${z.y}`);
  }
  if (close) moves.push("Z");
  return moves.join("");
};

export const containsPoint = (
  polygon: Polygon,
  z: Complex.Complex
): boolean => {
  let crossings = 0;
  for (const edge of Misc.adjacentPairs(polygon)) {
    const x = Segment.intersectHorizontal(edge, z.y);
    if (x !== null && x < z.x) ++crossings;
  }
  return crossings % 2 == 1;
};

export const hexagonalFit = (
  points: Polygon,
  radius: number
): Map<number, Set<number>> => {
  const rowHeight = Math.sqrt(3) * radius;
  const wallRows = new Map<number, Interval.Wall[]>();
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

export const cutThick = (points: Polygon, radius: number) => {
  const coordinates = hexagonalFit(points, radius);

  const nodes: Lattice.CoordinateMap<
    Graph.NodeUnresolved<Label.Full, Lattice.Coordinate>
  > = new Map();

  // store boundary to initialize later graph-search for "inner-most" coordinate
  const frontier: Lattice.Coordinate[] = [];
  const interior: Lattice.CoordinateSet = new Map();

  const rowHeight = radius * Math.sqrt(3);
  for (const [row, columns] of coordinates.entries()) {
    const nodeColumns = new Map<
      number,
      Graph.NodeUnresolved<Label.Full, Lattice.Coordinate>
    >();
    for (const column of columns) {
      const coordinate = { row, column };
      const petals = Lattice.hexagonalPetals(coordinate);
      const isInterior = petals.every((key) =>
        coordinates.get(key.row)?.has(key.column)
      );
      const position = Complex.complex(
        (row + 2 * column) * radius,
        row * rowHeight
      );
      const label = {
        data: coordinate,
        position,
        radius,
      };
      if (isInterior) {
        nodeColumns.set(column, { id: Symbol(), label, petals: [...petals] });
        Lattice.setAdd(interior, coordinate);
      } else {
        nodeColumns.set(column, { id: Symbol(), label, petals: null });
        frontier.push(coordinate);
      }
    }
    nodes.set(row, nodeColumns);
  }

  // breadth-first search inwards, starting from boundary coordinates,
  // to find farthest point from boundary, to use as initial origin node
  let lastVisited: Lattice.Coordinate | null = null;
  while (frontier.length) {
    const current = frontier.shift()!; // TODO deque
    for (const neighbor of Lattice.hexagonalPetals(current)) {
      if (!Lattice.setHas(interior, neighbor)) continue;
      Lattice.setDelete(interior, neighbor);
      lastVisited = neighbor;
      frontier.push(neighbor);
    }
  }

  return lastVisited
    ? Graph.resolveLazy(
        (key) => nodes.get(key.row)?.get(key.column),
        lastVisited
      )
    : null;
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
