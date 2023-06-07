import * as Graph from "$lib/graph";
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

export const layoutE = <T>(
  start: Graph.NodeInterior<
    Graph.Label.Radius & Graph.Label.Position & Graph.Label.Data<T>
  >
) => {
  start.label.position = Complex.zero;
  const startAngles = Geometry.petalAngles(
    Geometry.petalAngleE,
    start.label.radius,
    start.petals.map(Graph.Label.getRadius)
  );

  let startAngle = 0;
  for (let i = 0; i < startAngles.length; ++i) {
    const petal = start.petals[i]!;
    petal.label.position = Complex.polar(
      start.label.radius + petal.label.radius,
      startAngle
    );
    startAngle += startAngles[i]!;
  }

  const seen = new Set<Graph.Node<Graph.Label.Position>>();
  seen.add(start);
  for (const petal of start.petals) seen.add(petal);

  const frontier: {
    node: Graph.NodeInterior<Graph.Label.Position & Graph.Label.Radius>;
    parent: Graph.Node<Graph.Label.Position & Graph.Label.Radius>;
  }[] = [];
  for (const petal of start.petals)
    if (petal.petals) frontier.push({ parent: start, node: petal });
  while (frontier.length) {
    const edge = frontier.pop()!;
    if (!edge.node.petals) continue;

    const parentIndex = edge.node.petals.indexOf(edge.parent);
    const angles = Geometry.petalAngles(
      Geometry.petalAngleE,
      edge.node.label.radius,
      edge.node.petals.map(Graph.Label.getRadius)
    );
    let angle = Complex.arg(
      Complex.sub(edge.parent.label.position, edge.node.label.position)
    );
    for (let i = 0; i < edge.node.petals.length; ++i) {
      const j = (parentIndex + i) % edge.node.petals.length;
      const petal = edge.node.petals[j]!;

      if (!seen.has(petal)) {
        seen.add(petal);

        petal.label.position = Complex.add(
          edge.node.label.position,
          Complex.polar(edge.node.label.radius + petal.label.radius, angle)
        );

        if (petal.petals) frontier.push({ parent: edge.node, node: petal });
      }

      angle += angles[j]!;
    }
  }
};

export const layoutH = <T>(
  start: Graph.NodeInterior<Graph.Label.Position & Graph.Label.WithRadius<T>>
) => {
  start.label.position = Complex.zero;
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

  const parents = new Set<Graph.Node<Graph.Label.Position>>();
  parents.add(start);
  for (const petal of start.petals) parents.add(petal);

  const frontier: {
    node: Graph.NodeInterior<Graph.Label.Position & Graph.Label.Radius>;
    parent: Graph.Node<Graph.Label.Position & Graph.Label.Radius>;
  }[] = [];
  for (const petal of start.petals)
    if (petal.petals) frontier.push({ node: petal, parent: start });

  while (frontier.length) {
    const edge = frontier.pop()!;
    if (!edge.node.petals) continue;

    const parentIndex = edge.node.petals.indexOf(edge.parent);
    const angles = Geometry.petalAngles(
      Geometry.petalAngleH,
      edge.node.label.radius,
      edge.node.petals.map(Graph.Label.getRadius)
    );
    const axis = Complex.normalize(
      Complex.div(
        Complex.sub(edge.parent.label.position, edge.node.label.position),
        Complex.sub(
          Complex.one,
          Complex.mul(
            Complex.conj(edge.node.label.position),
            edge.parent.label.position
          )
        )
      )
    );

    let angle = 0;
    for (let i = 0; i < edge.node.petals.length; ++i) {
      const j = (parentIndex + i) % edge.node.petals.length;
      const petal = edge.node.petals[j]!;

      const dist = Math.sqrt(edge.node.label.radius * petal.label.radius);
      const bonk = Complex.mul(
        axis,
        Complex.polar((1 - dist) / (1 + dist), angle)
      );

      if (!parents.has(petal)) {
        petal.label.position = Complex.div(
          Complex.add(bonk, edge.node.label.position),
          Complex.add(
            Complex.one,
            Complex.mul(Complex.conj(edge.node.label.position), bonk)
          )
        );

        parents.add(petal);
        if (petal.petals) frontier.push({ node: petal, parent: edge.node });
      }

      angle += angles[j]!;
    }
  }
};
