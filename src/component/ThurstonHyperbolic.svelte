<script lang="ts">
  import * as Geometry from "$lib/geometry";
  import * as Complex from "$lib/complex";

  type Node<T> = { label: T; petalKeys: number[] };
  type PlanarGraph<T> = { interior: Map<number, Node<T>> };

  const add = (p: Complex.Complex, q: Complex.Complex) => ({
    x: p.x + q.x,
    y: p.y + q.y,
  });

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

  let n = 30;
  let thing = 0.92;

  $: getRadius = (radii: Map<number, number>) => (key: number) =>
    radii.get(key) ?? thing;

  $: pack = <T>(graph: PlanarGraph<T>) => {
    const radii = new Map<number, number>();
    for (const key of graph.interior.keys()) radii.set(key, 0.5);

    for (let i = 0; i < 256; ++i) {
      for (const [key, node] of graph.interior.entries()) {
        const nextRadius = Geometry.adjustFlowerHyperbolic(
          getRadius(radii)(key),
          node.petalKeys.map(getRadius(radii))
        );
        radii.set(key, nextRadius);
      }
    }
    return radii;
  };

  $: layout = <T>(
    graph: PlanarGraph<T>,
    radii: Map<number, number>,
    startKey: number
  ) => {
    const position = new Map<number, Complex.Complex>();

    const gr = getRadius(radii);

    const start = graph.interior.get(startKey)!;
    const startRadius = gr(startKey);
    position.set(startKey, { x: 0, y: 0 });
    const startAngles = Geometry.petalAnglesHyperbolic(
      startRadius,
      start.petalKeys.map(gr)
    );

    let startAngle = 0;
    for (let i = 0; i < startAngles.length; ++i) {
      const petalKey = start.petalKeys[i]!;
      const dist = Math.sqrt(startRadius * gr(petalKey));

      position.set(
        petalKey,
        Complex.polar((1 - dist) / (1 + dist), startAngle)
      );
      startAngle += startAngles[i]!;
    }

    const parentKeys = new Map<number, number>();
    parentKeys.set(startKey, startKey);
    for (const petalKey of start.petalKeys) parentKeys.set(petalKey, startKey);

    const frontierKeys: number[] = [...start.petalKeys];
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

  $: t = triangle(n);
  $: rs = pack(t);
  $: l = layout(t, rs, 4);
  $: console.log(rs, l);

  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  $: unitSize = Math.min(viewportWidth, viewportHeight) / 2.1;
</script>

<div class="layout">
  <div class="controls">
    <input type="number" bind:value={n} min={4} />
    <input type="number" bind:value={thing} step={0.01} />
  </div>
  <div
    class="sizer"
    bind:clientWidth={viewportWidth}
    bind:clientHeight={viewportHeight}
  >
    <svg width="100%" height="100%">
      <circle
        fill="transparent"
        stroke="red"
        cx={viewportWidth / 2}
        cy={viewportHeight / 2}
        r={unitSize}
      />
      {#each [...l.entries()] as [key, pos]}
        {@const s = getRadius(rs)(key)}
        {@const R = (1 - Math.sqrt(s)) / (1 + Math.sqrt(s))}
        {@const z = Complex.abs(pos)}
        {@const r = ((R * (1 - z * z)) / (1 - R * z * R * z)) * unitSize}
        {@const c = Complex.scale(pos, (1 - R * R) / (1 - R * z * (R * z)))}
        {@const x = c.x * unitSize + viewportWidth / 2}
        {@const y = -c.y * unitSize + viewportHeight / 2}
        <circle cx={x} cy={y} {r} opacity=".75" />
        <text
          {x}
          {y}
          font-size="2px"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle">{key}</text
        >
      {/each}
    </svg>
  </div>
</div>

<style>
  .layout {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto 1fr;
  }
</style>
