<script lang="ts">
  import * as Graph from "$lib/graph";
  import * as Complex from "$lib/complex";
  import * as Pack from "$lib/pack";
  import * as Geometry from "$lib/hyperbolic";
  import * as Cut from "$lib/cut";

  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  let hoverCircle: symbol | null = null;

  const enum ToolMode {
    Polygon,
    Normalize,
    DrawCurve,
  }

  let toolMode = ToolMode.Polygon;
  let toolDraw: { polygon: Complex.Complex[]; done: boolean } | null = null;

  const cutRadius = 0.02;
  $: pts = toolDraw?.done ? Cut.cut(toolDraw.polygon, cutRadius) : null;
  $: console.log(pts);

  let { graph } = Graph.Example.parallelogram(30, 3);
  let origin = Graph.interior(graph).next().value!;

  let euclidean = Graph.mapLabel(origin, (data) => ({
    data,
    radius: 1,
    position: Complex.zero,
  }));

  let hyperbolic = Graph.mapLabel(euclidean.origin, (label) => ({
    ...label,
    radius: 1e-5,
  }));

  Pack.relaxIterations(
    256,
    [...euclidean.replace.values()].filter(Graph.isInterior),
    Geometry.relaxFlowerE
  );
  Pack.layoutE(euclidean.origin);

  Pack.relaxIterations(
    256,
    [...hyperbolic.replace.values()].filter(Graph.isInterior),
    Geometry.relaxFlowerH
  );
  Pack.layoutH(hyperbolic.origin);

  $: unitSize = Math.min(viewportWidth, viewportHeight) / 2.1;
  $: unitSizeE =
    unitSize /
    Math.max(
      ...[...euclidean.replace.values()].map(
        (node) => Complex.abs(node.label.position) + node.label.radius
      )
    );

  const getPosition = (ev: MouseEvent, unit: number) =>
    Complex.scaleInv(
      Complex.complex(
        ev.offsetX - viewportWidth / 2,
        -(ev.offsetY - viewportHeight / 2)
      ),
      unit
    );

  const mouseDown = (ev: MouseEvent & { currentTarget: SVGElement }) => {
    const pos = getPosition(ev, unitSize);
    switch (toolMode) {
      case ToolMode.Polygon:
        toolDraw = { polygon: [pos], done: false };
        break;
    }
  };

  const mouseMove = (ev: MouseEvent) => {
    const pos = getPosition(ev, unitSize);
    switch (toolMode) {
      case ToolMode.Polygon:
        if (!toolDraw || toolDraw.done) return;
        toolDraw = { ...toolDraw, polygon: [...toolDraw.polygon, pos] };
    }
  };

  const mouseUp = () => {
    switch (toolMode) {
      case ToolMode.Polygon:
        if (toolDraw) toolDraw = { ...toolDraw, done: true };
    }
  };

  const mouseLeave = () => {
    if (toolDraw && !toolDraw.done) toolDraw = null;
  };

  $: toCanvas = (z: Complex.Complex) =>
    Complex.add(
      Complex.scale(Complex.conj(z), unitSize),
      Complex.complex(viewportWidth / 2, viewportHeight / 2)
    );
</script>

<div class="layout">
  <div class="top" />
  <div>
    <svg
      width="100%"
      height="100%"
      on:mousedown={mouseDown}
      on:mouseup={mouseUp}
      on:mousemove={mouseMove}
      on:mouseleave={mouseLeave}
    >
      {#if toolDraw}
        {@const first = toCanvas(toolDraw.polygon[0] ?? Complex.zero)}
        {@const pathD =
          `M${first.x} ${first.y}` +
          toolDraw.polygon
            .slice(1)
            .map(toCanvas)
            .map((p) => `L${p.x} ${p.y}`)
            .join("") +
          (toolDraw.done ? "Z" : "")}
        <path d={pathD} stroke="red" fill={toolDraw.done ? "silver" : "none"} />
      {/if}
      {#if pts}
        {#each pts as pt}
          {@const p = toCanvas(pt)}
          <circle cx={p.x} cy={p.y} r={cutRadius * unitSize} fill="blue" />
        {/each}
      {/if}
      {#each [...euclidean.replace.values()] as node}
        <circle
          on:mouseenter={() => void (hoverCircle = node.id)}
          on:mouseleave={() => void (hoverCircle = null)}
          data-row={node.label.data.row}
          data-column={node.label.data.column}
          r={node.label.radius * unitSizeE}
          cx={node.label.position.x * unitSizeE + viewportWidth / 2}
          cy={-node.label.position.y * unitSizeE + viewportHeight / 2}
          fill={node.id === hoverCircle ? "green" : "gray"}
        />
      {/each}
    </svg>
  </div>
  <div
    class="sizer"
    bind:clientWidth={viewportWidth}
    bind:clientHeight={viewportHeight}
  >
    <svg width="100%" height="100%">
      {#each [...hyperbolic.replace.values()] as node}
        {@const R =
          (1 - Math.sqrt(node.label.radius)) /
          (1 + Math.sqrt(node.label.radius))}
        {@const z = Complex.abs(node.label.position)}
        {@const r = ((R * (1 - z * z)) / (1 - R * z * R * z)) * unitSize}
        {@const c = Complex.scale(
          node.label.position,
          (1 - R * R) / (1 - R * z * (R * z))
        )}
        {@const x = c.x * unitSize + viewportWidth / 2}
        {@const y = -c.y * unitSize + viewportHeight / 2}
        <circle
          on:mouseenter={() => void (hoverCircle = node.id)}
          on:mouseleave={() => void (hoverCircle = null)}
          cx={x}
          cy={y}
          {r}
          fill={node.id === hoverCircle ? "green" : "gray"}
        />
      {/each}
    </svg>
  </div>
</div>

<style>
  .layout {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-areas: "top top" "left right";
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr 1fr;
  }
  .top {
    grid-area: top;
  }
  svg {
  }
</style>
