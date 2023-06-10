import * as Complex from "$lib/complex";
import * as Graph from "$lib/graph";
import * as Misc from "$lib/misc";

const findIntercepts = (points: Complex.Complex[], step: number) => {
  const intercepts = new Map<number, number[]>();
  for (const [z1, z2] of Misc.adjacentPairs(points)) {
    const r1 = z1.y / step;
    const r2 = z2.y / step;
    const rMin = Math.floor(Math.min(r1, r2));
    const rMax = Math.floor(Math.max(r1, r2));
    for (let r = rMin + 1; r <= rMax; ++r) {
      const y = r * step;
      const x = z1.x + ((z2.x - z1.x) * (y - z1.y)) / (z2.y - z1.y);

      if (!intercepts.has(r)) intercepts.set(r, []);
      intercepts.get(r)!.push(x);
    }
  }
  for (const row of intercepts.values()) row.sort();
  return intercepts;
};

const cut = (points: Complex.Complex[], radius: number) => {
  const graph: Graph.GraphUnresolved<
    Graph.Label.Position &
      Graph.Label.Radius &
      Graph.Label.Data<{ row: number; column: number }>
  > = new Map();
};
