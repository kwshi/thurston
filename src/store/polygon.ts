import * as Store from "svelte/store";

import * as Complex from "$lib/complex";
import * as Polygon from "$lib/polygon";
import * as Graph from "$lib/graph";
import * as Pack from "$lib/pack";
import * as Geometry from "$lib/geometry";

import * as Parameter from "$store/parameter";

import terryDrawing from "./default/terryDrawing.json";

export const domain = Store.writable<{
  readonly polygon: Polygon.Polygon;
  readonly zero: Complex.Complex;
  readonly axis: Complex.Complex;
}>({
  polygon: [Complex.one, Complex.i, Complex.fromRe(-1), Complex.fromIm(-1)],
  zero: Complex.zero,
  axis: Complex.fromRe(1 / 2),
});

export const packing = Store.derived(
  [domain, Parameter.packingRadius],
  ([$domain, $packingRadius]) => {
    const euclidean = Polygon.cutThick($domain.polygon, $packingRadius);
    if (!euclidean) return null;

    const hyperbolic = Graph.mapLabel(euclidean.origin, (label) => ({
      ...label,
      radius: 1e-5,
    }));

    Pack.relaxIterations(
      256,
      [...hyperbolic.replace.values()].filter(Graph.isInterior),
      Geometry.relaxFlowerH
    );
    Pack.layoutH(hyperbolic.origin);

    const mapPointRaw = (z: Complex.Complex) => {
      const rowHeight = $packingRadius * Math.sqrt(3);
      const row = z.y / rowHeight;
      const column = (z.x / $packingRadius - row) / 2;

      const cornerRow = Math.floor(row);
      const cornerColumn = Math.floor(column);

      const deltaRow = row - cornerRow;
      const deltaColumn = column - cornerColumn;
      const delta = deltaRow + deltaColumn;

      const triangle =
        delta > 1
          ? ([
              {
                coordinate: { row: cornerRow, column: cornerColumn + 1 },
                weight: 1 - deltaRow,
              },
              {
                coordinate: { row: cornerRow + 1, column: cornerColumn + 1 },
                weight: delta - 1,
              },
              {
                coordinate: { row: cornerRow + 1, column: cornerColumn },
                weight: 1 - deltaColumn,
              },
            ] as const)
          : ([
              {
                coordinate: { row: cornerRow, column: cornerColumn },
                weight: 1 - delta,
              },
              {
                coordinate: { row: cornerRow, column: cornerColumn + 1 },
                weight: deltaColumn,
              },
              {
                coordinate: { row: cornerRow + 1, column: cornerColumn },
                weight: deltaRow,
              },
            ] as const);

      let total = Complex.zero;
      for (const handle of triangle) {
        const nodeE = euclidean.nodes
          .get(handle.coordinate.row)
          ?.get(handle.coordinate.column);
        if (!nodeE) return null;
        const nodeH = hyperbolic.replace.get(nodeE)!;
        const { center } = Geometry.hyperbolicCircleToEuclidean(
          nodeH.label.position,
          nodeH.label.radius
        );
        total = Complex.add(total, Complex.scale(center, handle.weight));
      }

      return total;
    };

    //const defaultZero = euclidean.origin.label.position;
    //const defaultAxis = euclidean.origin.petals[0]!.label.position;

    const zeroImage = mapPointRaw($domain.zero);
    const mobius = (z: Complex.Complex) =>
      zeroImage
        ? Complex.div(
            Complex.sub(z, zeroImage),
            Complex.sub(Complex.one, Complex.mul(Complex.conj(zeroImage), z))
          )
        : null;
    const axisFirstImage = mapPointRaw($domain.axis);
    const axisImage = axisFirstImage ? mobius(axisFirstImage) : null;
    const axisAngle = axisImage ? Complex.arg(axisImage) : 0;
    const mobiusRotate = (z: Complex.Complex) => {
      const w = mobius(z);
      if (!w) return null;
      return Complex.mul(Complex.polar(1, -axisAngle), w);
    };
    const newHyperbolic =
      zeroImage && axisImage
        ? Graph.mapLabel(hyperbolic.origin, (label) => {
            return {
              ...label,
              position: mobiusRotate(label.position)!,
            };
          })
        : hyperbolic;

    const mapPoint = (z: Complex.Complex) => {
      const w = mapPointRaw(z);
      return w ? mobiusRotate(w) : null;
    };

    const mapDrawing = (drawing: Polygon.Polygon) => {
      const mapped: Polygon.Polygon[] = [];
      let partial: Complex.Complex[] = [];
      for (const z of drawing) {
        const w = mapPoint(z);
        if (!w) {
          if (partial) {
            mapped.push(partial);
            partial = [];
          }
          continue;
        }
        partial.push(w);
      }
      if (partial) mapped.push(partial);
      return mapped;
    };

    return {
      euclideanGraph: euclidean.origin,
      hyperbolicGraph: newHyperbolic.origin,
      mapPoint,
      mapDrawing,
    };
  }
);

export const drawings = Store.writable<Polygon.Polygon[]>([]);

export const mappedDrawings = Store.derived(
  [drawings, packing],
  ([$drawings, $packing]) =>
    $packing ? $drawings.flatMap($packing.mapDrawing) : []
);
