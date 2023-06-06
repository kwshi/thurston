import type * as Complex from "$lib/complex";
export type NodeOf<T, P> = { id: symbol; label: T; petals: P };

export type NodeUnresolved<T> = NodeOf<T, number[] | null>;

export type NodeInterior<T> = NodeOf<T, Node<T>[]>;
export type NodeBoundary<T> = NodeOf<T, null>;
export type Node<T> = NodeOf<T, Node<T>[] | null>;

export type GraphUnresolved<T> = Map<number, NodeUnresolved<T>>;
export type Graph<T> = Map<number, Node<T>>;

export namespace Label {
  export type Radius = { radius: number };
  export type Position = { position: Complex.Complex };
  export type Data<T> = { data: T };
  export type WithRadius<T> = Radius & Data<T>;
}

const mapLabel = <A, B>(f: (a: A) => B, graph: Graph<A>): Graph<B> => {
  const replace = new Map<Node<A>, Node<B>>();

  //const mapped: Graph<B> = new Map();
  for (const [key, node] of graph.entries())
    mapped.set(key, { ...node, label: f(node.label) });
};

export const interior = <T>(graph: Graph<T>) => {
  const nodes: NodeInterior<T>[] = [];
  for (const node of graph.values())
    if (node.petals) nodes.push({ ...node, petals: node.petals });
  return nodes;
};

export const resolve = <T>(
  graphUnresolved: GraphUnresolved<T>
): { graph: Graph<T>; missing: Map<number, number[]> } => {
  const graph: Graph<T> = new Map();
  const missing = new Map<number, number[]>();

  for (const [nodeKey, nodeUnresolved] of graphUnresolved.entries())
    graph.set(nodeKey, { ...nodeUnresolved, petals: null });

  for (const [nodeKey, nodeUnresolved] of graphUnresolved.entries()) {
    const node = graph.get(nodeKey)!;
    if (!nodeUnresolved.petals) continue;

    node.petals = [];
    for (const petalKey of nodeUnresolved.petals) {
      const petal = graph.get(petalKey);
      if (!petal) {
        const missingList = missing.get(nodeKey) ?? [];
        missingList.push(petalKey);
        missing.set(nodeKey, missingList);
        continue;
      }
      node.petals.push(petal);
    }
  }

  return { graph, missing };
};

export namespace Example {
  export const triangle = (n: number) => {
    const graph: GraphUnresolved<{ row: number; column: number }> = new Map();
    const label = (row: number, column: number) => ({ row, column });
    const hash = (i: number, j: number) => ((i * (i + 1)) >> 1) + j;

    const graphSet = (i: number, j: number, petals: number[] | null) =>
      graph.set(hash(i, j), {
        id: Symbol(),
        label: label(i, j),
        petals,
      });

    // top/bottom boundary
    graphSet(0, 0, null);
    for (let j = 0; j <= n; ++j) graphSet(n, j, null);

    for (let i = 1; i < n; ++i) {
      // left/right boundary
      graphSet(i, 0, null);
      graphSet(i, i, null);

      // interior
      for (let j = 1; j < i; ++j)
        graphSet(i, j, [
          hash(i, j + 1),
          hash(i - 1, j),
          hash(i - 1, j - 1),
          hash(i, j - 1),
          hash(i + 1, j),
          hash(i + 1, j + 1),
        ]);
    }

    return resolve(graph);
  };

  export const parallelogram = (m: number, n: number) => {
    const graph: GraphUnresolved<{ row: number; column: number }> = new Map();
    const hash = (i: number, j: number) => i * (n + 1) + j;

    const graphSet = (i: number, j: number, petals: number[] | null) =>
      graph.set(hash(i, j), {
        id: Symbol(),
        label: { row: i, column: j },
        petals,
      });

    // top/bottom boundary
    for (let j = 0; j <= n; ++j) {
      graphSet(0, j, null);
      graphSet(m, j, null);
    }

    for (let i = 1; i < m; ++i) {
      // left/right boundary
      graphSet(i, 0, null);
      graphSet(i, n, null);

      // interior
      for (let j = 1; j < n; ++j)
        graphSet(i, j, [
          hash(i, j + 1),
          hash(i - 1, j),
          hash(i - 1, j - 1),
          hash(i, j - 1),
          hash(i + 1, j),
          hash(i + 1, j + 1),
        ]);
    }
  };

  export const rectangle = (_m: number, _n: number) => {};

  export const hexagon = (_m: number, _n: number, _o: number) => {};
}
