import * as Complex from "$lib/complex";
import * as Graph from "$lib/graph";

const cut = (points: Complex.Complex[]) => {
  const graph: Graph.GraphUnresolved<
    Graph.Label.Position &
      Graph.Label.Radius &
      Graph.Label.Data<{ row: number; column: number }>
  > = new Map();
};
