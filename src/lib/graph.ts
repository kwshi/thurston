export type Node<T> = { label: T; petalKeys: number[] };
export type PlanarGraph<T> = { interior: Map<number, Node<T>> };
