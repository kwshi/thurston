import type * as Graph from "$lib/graph";
import * as Complex from "$lib/complex";
import * as Geometry from "$lib/hyperbolic";

export const relax = <T>(
  nodes: Graph.Node<Graph.Label.WithRadius<T>>[],
  relaxFlower: (r: number, petals: number[]) => number
) => {
  for (const node of nodes) {
    if (!node.petals) continue;
    node.label.radius = relaxFlower(
      node.label.radius,
      node.petals.map((petal) => petal.label.radius)
    );
  }
};

export const relaxIterations = <T>(
  n: number,
  nodes: Graph.Node<Graph.Label.WithRadius<T>>[],
  relaxFlower: (r: number, petals: number[]) => number
) => {
  for (let i = 0; i < n; ++i) relax(nodes, relaxFlower);
};

export const layout = <T>(
  start: Graph.NodeInterior<Graph.Label.Position & Graph.Label.WithRadius<T>>
) => {
  const position = new Map<number, Complex.Complex>();

  const startAngles = Geometry.petalAngles(
    Geometry.petalAngleH,
    start.label.radius,
    start.petals.map((node) => node.label.radius)
  );

  let startAngle = 0;
  for (let i = 0; i < startAngles.length; ++i) {
    const petal = start.petals[i]!;
    const dist = Math.sqrt(start.label.radius * petal.label.radius);
    petal.label.position = Complex.polar((1 - dist) / (1 + dist), startAngle);
    startAngle += startAngles[i]!;
  }

  const parents = new Map<
    symbol,
    Graph.Node<Graph.Label.Position & Graph.Label.Radius>
  >();
  for (const petal of start.petals) parents.set(petal.id, start);

  const frontierKeys: Graph.Node<Graph.Label.Position & Graph.Label.Radius>[] =
    [...start.petals];
  while (frontierKeys.length) {
    const currentKey = frontierKeys.shift()!;
    const node = graph.interior.get(currentKey);
    if (!node) continue;

    const currentRadius = radii.get(currentKey)!;
    const currentPos = position.get(currentKey)!;
    const parentKey = parentKeys.get(currentKey)!;
    const parentPos = position.get(parentKey)!;

    const parentIndex = node.petalKeys.indexOf(parentKey);
    const angles = Geometry.petalAnglesHyperbolic(
      gr(currentKey),
      node.petalKeys.map(gr)
    );
    const axis = Complex.normalize(
      Complex.div(
        Complex.sub(parentPos, currentPos),
        Complex.sub(
          Complex.one,
          Complex.mul(Complex.conj(currentPos), parentPos)
        )
      )
    );
    let angle = 0;
    for (let i = 0; i < node.petalKeys.length; ++i) {
      const j = (parentIndex + i) % node.petalKeys.length;
      const petalKey = node.petalKeys[j]!;

      const dist = Math.sqrt(currentRadius * gr(petalKey));
      const bonk = Complex.mul(
        axis,
        Complex.polar((1 - dist) / (1 + dist), angle)
      );

      if (!parentKeys.has(petalKey)) {
        position.set(
          petalKey,
          Complex.div(
            Complex.add(bonk, currentPos),
            Complex.add(
              Complex.one,
              Complex.mul(Complex.conj(currentPos), bonk)
            )
          )
        );

        parentKeys.set(petalKey, currentKey);
        frontierKeys.push(petalKey);
      }

      angle += angles[j]!;
    }
  }

  return position;
};
