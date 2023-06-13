import * as Complex from "$lib/complex";
//import * as Graph from "$lib/graph";
import * as Misc from "$lib/misc";

type Interval = { readonly min: number; readonly max: number };
type Wall = { readonly interval: Interval; readonly cross: number | null };
type Segment = readonly [Complex.Complex, Complex.Complex];

export const shiftSegment = ([z, w]: Segment, shift: Complex.Complex) =>
  [Complex.add(z, shift), Complex.add(w, shift)] as const;

export const widenSegment = (segment: Segment, radius: number) => {
  const [z, w] = segment;
  if (Complex.eq(z, w)) return null;
  const direction = Complex.mul(
    Complex.normalize(Complex.sub(w, z)),
    Complex.fromIm(radius)
  );
  return [
    shiftSegment(segment, direction),
    shiftSegment(segment, Complex.neg(direction)),
  ] as const;
};

const intersectSegment = ([z, w]: Segment, y: number): number | null => {
  const dy = w.y - z.y;
  if (!dy) return null;

  const t = (y - z.y) / dy;
  return 0 <= t && t < 1 ? (1 - t) * z.x + t * w.x : null;
};

const pointSpacing = (y1: number, y2: number, radius: number) => {
  const h = Math.abs(y1 - y2);
  return h >= radius ? null : Math.sqrt(radius * radius - h * h);
};

const sequenceHull = (intercepts: readonly number[]): Interval | null => {
  if (!intercepts.length) return null;

  let min = intercepts[0]!;
  let max = min;
  for (let i = 1; i < intercepts.length; ++i) {
    const x = intercepts[i]!;
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { min, max } as const;
};

export const segmentHull = (
  segment: Segment,
  radius: number,
  y: number
): Wall | null => {
  const [z1, z2] = segment;

  const w1 = pointSpacing(z1.y, y, radius);
  const w2 = pointSpacing(z2.y, y, radius);

  const intercepts: number[] = [];
  if (w1) intercepts.push(z1.x - w1, z1.x + w1);
  if (w2) intercepts.push(z2.x - w2, z2.x + w2);

  const [seg, see] = widenSegment(segment, radius)!;
  const segX = intersectSegment(seg, y);
  const seeX = intersectSegment(see, y);

  const cross = intersectSegment(segment, y);

  if (segX !== null) intercepts.push(segX);
  if (seeX !== null) intercepts.push(seeX);

  const interval = sequenceHull(intercepts);

  return interval ? { interval, cross } : null;
};

export const viableIntervals = (walls: Wall[]): Interval[] => {
  if (!walls.length) return [];
  walls.sort((a, b) => a.interval.min - b.interval.min);

  const spaces: Interval[] = [];
  let left = walls[0]!.interval.max;
  let inside = walls[0]!.cross !== null;
  for (let i = 1; i < walls.length; ++i) {
    const wall = walls[i]!;
    if (wall.interval.min > left && inside)
      spaces.push({ min: left, max: wall.interval.min });
    if (wall.interval.max > left) {
      left = wall.interval.max;
    }
    if (wall.cross !== null) inside = !inside;
  }

  if (!spaces.length) {
    console.log("walls", walls);
  }

  return spaces;
};

export const cutThick = (points: Complex.Complex[], radius: number) => {
  const stuff: Complex.Complex[] = [];
  const whee: Complex.Complex[] = [];
  const walls: Segment[] = [];
  const crosses: Complex.Complex[] = [];

  if (!radius) return { stuff, whee, walls, crosses };

  const step = Math.sqrt(3) * radius;
  const rows = new Map<number, Wall[]>();
  for (const [z1, z2] of Misc.adjacentPairs(points)) {
    const rMin = Math.floor((Math.min(z1.y, z2.y) - radius) / step);
    const rMax = Math.floor((Math.max(z1.y, z2.y) + radius) / step);
    for (let r = rMin + 1; r <= rMax; ++r) {
      const y = r * step;
      const interval = segmentHull([z1, z2], radius, y);

      if (!rows.has(r)) rows.set(r, []);
      if (interval) rows.get(r)!.push(interval);
      // TODO reason through null-checks
    }
  }

  for (const [r, row] of rows.entries()) {
    const y = r * step;
    for (const int of row) {
      walls.push([
        Complex.complex(int.interval.min, y),
        Complex.complex(int.interval.max, y),
      ]);
      if (int.cross !== null) crosses.push(Complex.complex(int.cross, y));
    }
    for (const interval of viableIntervals(row)) {
      whee.push(Complex.complex(interval.min, y));
      whee.push(Complex.complex(interval.max, y));
      const left = Math.ceil((interval.min / radius - r) / 2);
      const right = Math.floor((interval.max / radius - r) / 2);
      for (let j = left; j <= right; ++j) {
        stuff.push(Complex.complex((r + 2 * j) * radius, y));
      }

      //stuff.push(
      //  Complex.complex(interval.min, y),
      //  Complex.complex(interval.max, y)
      //);
    }
    //viableIntervals(row)
  }

  return { stuff, whee, walls, crosses };

  //const graph: Graph.GraphUnresolved<
  //  Graph.Label.Position &
  //    Graph.Label.Radius &
  //    Graph.Label.Data<{ row: number; column: number }>
  //> = new Map();
};

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
