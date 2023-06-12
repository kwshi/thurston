import * as Complex from "$lib/complex";
//import * as Graph from "$lib/graph";
import * as Misc from "$lib/misc";

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
