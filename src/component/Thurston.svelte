<script lang="ts">
  import * as Geometry from "$lib/geometry";

  const n = 5;

  type Node<T> = { label: T; petalKeys: number[] };
  type PlanarGraph<T> = { interior: Map<number, Node<T>> };
  type Point = { x: number; y: number };

  const polar = (r: number, θ: number) => ({
    x: r * Math.cos(θ),
    y: r * Math.sin(θ),
  });

  const add = (p: Point, q: Point) => ({ x: p.x + q.x, y: p.y + q.y });

  const triangle = (
    n: number
  ): PlanarGraph<{ row: number; column: number }> => {
    const graph: PlanarGraph<{ row: number; column: number }> = {
      interior: new Map(),
    };

    const hash = (i: number, j: number) => ((i * (i + 1)) >> 1) + j;

    for (let i = 2; i < n - 1; ++i) {
      for (let j = 1; j < i; ++j) {
        const node: Node<{ row: number; column: number }> = {
          label: { row: i, column: j },
          petalKeys: [
            hash(i, j + 1),
            hash(i - 1, j),
            hash(i - 1, j - 1),
            hash(i, j - 1),
            hash(i + 1, j),
            hash(i + 1, j + 1),
          ],
        };
        graph.interior.set(hash(i, j), node);
      }
    }

    return graph;
  };

  const pack = <T>(graph: PlanarGraph<T>) => {
    const radii = new Map<number, number>();
    for (const key of graph.interior.keys()) radii.set(key, 1);

    for (let i = 0; i < 10; ++i) {
      for (const [key, node] of graph.interior.entries()) {
        const nextRadius = Geometry.adjustFlower(
          radii.get(key) ?? 1,
          node.petalKeys.map((key) => radii.get(key) ?? 1)
        );
        radii.set(key, nextRadius);
      }
    }
    return radii;
  };

  const layout = <T>(
    graph: PlanarGraph<T>,
    radii: Map<number, number>,
    startKey: number
  ) => {
    const position = new Map<number, Point>();

    const start = graph.interior.get(startKey)!;
    const startRadius = radii.get(startKey) ?? 1;
    position.set(startKey, { x: 0, y: 0 });
    const startAngles = Geometry.petalAngles(
      startRadius,
      start.petalKeys.map((key) => radii.get(key) ?? 1)
    );

    let startAngle = 0;
    for (let i = 0; i < startAngles.length; ++i) {
      const petalKey = start.petalKeys[i]!;
      position.set(
        petalKey,
        polar(startRadius + (radii.get(petalKey) ?? 1), startAngle)
      );
      startAngle += startAngles[i]!;
    }

    const parentKeys = new Map<number, number>();
    for (const petalKey of start.petalKeys) parentKeys.set(petalKey, startKey);

    const frontierKeys: number[] = [...start.petalKeys];
    while (frontierKeys.length) {
      const currentKey = frontierKeys.pop()!;
      const node = graph.interior.get(currentKey);
      if (!node) continue;

      console.log(currentKey);

      const currentRadius = radii.get(currentKey)!;
      const currentPos = position.get(currentKey)!;
      const parentKey = parentKeys.get(currentKey)!;
      const parentPos = position.get(parentKey)!;

      const parentIndex = node.petalKeys.indexOf(parentKey);
      const angles = Geometry.petalAngles(
        radii.get(currentKey) ?? 1,
        node.petalKeys.map((key) => radii.get(key) ?? 1)
      );
      let angle = Math.atan2(
        parentPos.y - currentPos.y,
        parentPos.x - currentPos.x
      );
      for (let i = 0; i < node.petalKeys.length; ++i) {
        const j = (parentIndex + i) % node.petalKeys.length;
        const petalKey = node.petalKeys[j]!;

        //if (parentKeys.has(petalKey)) continue;

        position.set(
          petalKey,
          add(
            currentPos,
            polar(currentRadius + (radii.get(petalKey) ?? 1), angle)
          )
        );
        angle += angles[j]!;

        // TODO short-circuit if not interior, maybe, we'll see
      }
    }

    return position;
  };

  const t = triangle(8);
  const rs = pack(t);
  const l = layout(t, rs, 4);
  console.log(l);

  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  $: unitSize = Math.min(viewportWidth, viewportHeight) / 16;
</script>

<div
  class="sizer"
  bind:clientWidth={viewportWidth}
  bind:clientHeight={viewportHeight}
>
  <svg width="100%" height="100%">
    {#each [...l.entries()] as [key, pos]}
      {@const r = (rs.get(key) ?? 1) * unitSize}
      {@const x = pos.x * unitSize + viewportWidth / 2}
      {@const y = -pos.y * unitSize + viewportHeight / 2}
      <circle cx={x} cy={y} {r} />
      <text {x} {y} fill="white" text-anchor="middle" dominant-baseline="middle"
        >{key}</text
      >
    {/each}
  </svg>
</div>

<style>
  .sizer {
    position: absolute;
    inset: 0;
  }
</style>
