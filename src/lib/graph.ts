import type * as Complex from "$lib/complex";
import * as Lattice from "$lib/lattice";

export type NodeOf<T, P> = { id: symbol; label: T; petals: P };

export type NodeUnresolved<T, K = number> = NodeOf<T, K[] | null>;

export type NodeInterior<T> = NodeOf<T, Node<T>[]>;
export type NodeBoundary<T> = NodeOf<T, null>;
export type Node<T> = NodeInterior<T> | NodeBoundary<T>;

export type GraphUnresolved<T> = Map<number, NodeUnresolved<T>>;
export type Graph<T> = Map<number, Node<T>>;

export namespace Label {
  export type Radius = { radius: number };
  export type Position = { position: Complex.Complex };
  export type Data<T> = { data: T };
  export type WithRadius<T> = Radius & Data<T>;

  export const getRadius = (a: Node<Radius>) => a.label.radius;
}

export const mapLabel = <A, B>(
  origin: NodeInterior<A>,
  f: (a: A) => B
): { replace: Map<Node<A>, Node<B>>; origin: NodeInterior<B> } => {
  // graph search to initialize all replacement nodes
  const replace = new Map<Node<A>, Node<B>>();
  for (const node of traverseDfs(origin))
    if (!replace.has(node))
      replace.set(node, { ...node, label: f(node.label), petals: null });

  // graph search (again) to update all petal dependencies
  for (const node of traverseDfs(origin))
    replace.get(node)!.petals =
      node.petals?.map((petal) => replace.get(petal)!) ?? null;

  return { origin: replace.get(origin) as NodeInterior<B>, replace };
};

export const isInterior = <T>(node: Node<T>): node is NodeInterior<T> =>
  !!node.petals;

export const interior = function* <T>(
  graph: Graph<T>
): Iterator<NodeInterior<T>, void, never> {
  for (const node of graph.values()) if (node.petals) yield node;
};

//export const resolve2 = <T>(
//  graphUnresolved: Map<
//    number,
//    Map<number, NodeUnresolved<T, { row: number; column: number }>>
//  >
//): { graph: Graph<T>; missing: Map<number, Map<number, {row:number,column:number}[]>> } => {
//  const graph = new Map<number, Map<number, Node<T>>>();
//  const missing = new Map<number, Map<number, {row:number,column:number}[]>>();
//
//  for (const [row, columnsUnresolved] of graphUnresolved.entries()) {
//    const columns = new Map();
//    for (const [column, nodeUnresolved] of columnsUnresolved.entries())
//      columns.set(column, { ...nodeUnresolved, petals: null });
//    graph.set(row, columns);
//  }
//
//  for (const [row, columnsUnresolved] of graphUnresolved.entries()) {
//  for (const [column, nodeUnresolved] of columnsUnresolved.entries()) {
//    const node = graph.get(row)!.get(column)!;
//    if (!nodeUnresolved.petals) continue;
//
//    node.petals = [];
//    for (const petalKey of nodeUnresolved.petals) {
//      const petal = graph.get(petalKey.row)?.get(petalKey.column);
//      if (!petal) {
//        if (!missing.has(row)) missing.set(row, new Map());
//        const missingColumns = missing.get(row)!
//        if (!missingColumns.has(row)) missingColumns.set(column, [])
//        missingColumns.get(column)!.push(petalKey);
//        continue;
//      }
//      node.petals.push(petal);
//    }
//  }
//
//  return { graph, missing };
//};

export const resolveLazy = <T>(
  lookup: (key: {
    row: number;
    column: number;
  }) => NodeUnresolved<T, { row: number; column: number }> | undefined,
  originKey: { row: number; column: number }
): {
  nodes: Lattice.CoordinateMap<Node<T>>;
  origin: NodeInterior<T>;
  missing: { row: number; column: number }[];
} => {
  const cache = new Map<
    number,
    Map<number, { node: Node<T>; petals: Lattice.Coordinate[] | null }>
  >();
  const missing: Lattice.Coordinate[] = [];

  // initial graph search to populate cache
  const frontier = [originKey];
  while (frontier.length) {
    const key = frontier.pop()!;
    if (cache.get(key.row)?.has(key.column)) continue;

    const nodeUnresolved = lookup(key);
    if (!nodeUnresolved) {
      missing.push(key);
      continue;
    }

    const node = { ...nodeUnresolved, petals: null };
    if (!cache.has(key.row)) cache.set(key.row, new Map());
    cache
      .get(key.row)!
      .set(key.column, { node, petals: nodeUnresolved.petals });

    if (!nodeUnresolved.petals) continue;
    frontier.push(...nodeUnresolved.petals);
  }

  // attach dependencies
  const nodes: Lattice.CoordinateMap<Node<T>> = new Map();
  for (const [row, columns] of cache.entries()) {
    const nodeColumns = new Map<number, Node<T>>();
    nodes.set(row, nodeColumns);
    for (const [column, cell] of columns.entries()) {
      nodeColumns.set(column, cell.node);
      if (!cell.petals) continue;
      cell.node.petals = [];
      for (const key of cell.petals) {
        const petal = cache.get(key.row)?.get(key.column)?.node;
        if (!petal) continue;
        cell.node.petals.push(petal);
      }
    }
  }

  return {
    // TODO get rid of type assertion
    origin: cache.get(originKey.row)?.get(originKey.column)
      ?.node as NodeInterior<T>,
    nodes,
    missing,
  };
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
        if (!missing.has(nodeKey)) missing.set(nodeKey, []);
        missing.get(nodeKey)!.push(petalKey);
        continue;
      }
      node.petals.push(petal);
    }
  }

  return { graph, missing };
};

export const traverseDfs = function* <T>(origin: Node<T>) {
  const seen = new Set<Node<T>>();
  const frontier = [origin];

  for (;;) {
    const node = frontier.pop();
    if (!node) break;

    yield node;

    if (!node.petals) continue;
    for (const petal of node.petals) {
      if (seen.has(petal)) continue;
      seen.add(petal);
      frontier.push(petal);
    }
  }
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

    return resolve(graph);
  };

  export const rectangle = (m: number, n: number) => {
    const graph: GraphUnresolved<{ row: number; column: number }> = new Map();
    const hash = (i: number, j: number) => i * (2 * n + 1) + j;

    const graphSet = (i: number, j: number, petals: number[] | null) =>
      graph.set(hash(i, j), {
        id: Symbol(),
        label: { row: i, column: j },
        petals,
      });

    // top/bottom boundary
    for (let j = 0; j <= n; ++j) {
      graphSet(0, 2 * j, null);
      graphSet(2 * m, 2 * j, null);
    }

    // lattice rows
    for (let i = 1; i < m; ++i) {
      // left/right boundary
      graphSet(2 * i, 0, null);
      graphSet(2 * i, 2 * n, null);

      // interior
      for (let j = 1; j < n; ++j)
        graphSet(2 * i, 2 * j, [
          hash(2 * i, 2 * (j + 1)),
          hash(2 * i - 1, 2 * j + 1),
          hash(2 * (i - 1), 2 * j),
          hash(2 * i - 1, 2 * j - 1),
          hash(2 * i, 2 * (j - 1)),
          hash(2 * i + 1, 2 * j - 1),
          hash(2 * (i + 1), 2 * j),
          hash(2 * i + 1, 2 * j + 1),
        ]);
    }

    // square "centers"
    for (let i = 0; i < m; ++i)
      for (let j = 0; j < n; ++j)
        graphSet(2 * i + 1, 2 * j + 1, [
          hash(2 * i, 2 * j),
          hash(2 * (i + 1), 2 * j),
          hash(2 * (i + 1), 2 * (j + 1)),
          hash(2 * i, 2 * (j + 1)),
        ]);

    return resolve(graph);
  };

  export const hexagon = (_m: number, _n: number, _o: number) => {};
}
