export type NodeUnresolved<T> = { label: T; petals: number[] | null };
export type Node<T> = { label: T; petals: Node<T>[] | null };

export type WithRadius<T> = { radius: number; data: T };

export const relax = <T>(
  nodes: Node<WithRadius<T>>[],
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

export const resolve = <T>(
  lookup: Map<number, NodeUnresolved<T>>
): { nodes: Map<number, Node<T>>; missing: Map<number, number[]> } => {
  const nodes = new Map<number, Node<T>>();
  const missing = new Map<number, number[]>();

  for (const [nodeKey, unresolved] of lookup.entries())
    nodes.set(nodeKey, { label: unresolved.label, petals: null });

  for (const [nodeKey, unresolved] of lookup.entries()) {
    const node = nodes.get(nodeKey)!;
    if (!unresolved.petals) continue;

    node.petals = [];
    for (const petalKey of unresolved.petals) {
      const petal = nodes.get(petalKey);
      if (!petal) {
        const missingList = missing.get(nodeKey) ?? [];
        missingList.push(petalKey);
        missing.set(nodeKey, missingList);
        continue;
      }
      node.petals.push(petal);
    }
  }

  return { nodes, missing };
};
