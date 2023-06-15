import * as Store from "svelte/store";

import * as Complex from "$lib/complex";
import * as Polygon from "$lib/polygon";
import * as Graph from "$lib/graph";
import * as Pack from "$lib/pack";
import * as Geometry from "$lib/geometry";

import * as Parameter from "$store/parameter";

export const polygon = Store.writable<Polygon.Polygon>([
  Complex.one,
  Complex.i,
  Complex.fromRe(-1),
  Complex.fromIm(-1),
]);

export const graphE = Store.derived(
  [polygon, Parameter.packingRadius],
  ([$polygon, $packingRadius]) => Polygon.cutThick($polygon, $packingRadius)
);

export const graphH = Store.derived(graphE, ($graphE) => {
  if (!$graphE) return null;

  const graph = Graph.mapLabel($graphE.origin, (label) => ({
    ...label,
    radius: 1e-5,
  }));

  Pack.relaxIterations(
    256,
    [...graph.replace.values()].filter(Graph.isInterior),
    Geometry.relaxFlowerH
  );
  Pack.layoutH(graph.origin);

  return graph.origin;
});

export const drawings = Store.writable<Polygon.Polygon[]>([]);
