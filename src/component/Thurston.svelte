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
  let toolPosition: Complex.Complex | null = null;

  let cutRadius = 0.03;
  $: euclidean = toolDraw?.done
    ? Cut.cutThick(toolDraw.polygon, cutRadius)
    : null;

  $: origin = euclidean?.origin
    ? (euclidean.origin as Graph.NodeInterior<
        Graph.Label.Position &
          Graph.Label.Radius &
          Graph.Label.Data<{ row: number; column: number }>
      >)
    : undefined;

  $: hyperbolic = origin
    ? Graph.mapLabel(origin, (label) => ({
        ...label,
        radius: 1e-5,
      }))
    : undefined;

  $: if (hyperbolic) {
    Pack.relaxIterations(
      256,
      [...hyperbolic.replace.values()].filter(Graph.isInterior),
      Geometry.relaxFlowerH
    );
    Pack.layoutH(hyperbolic.origin);
  }

  $: unitSize = Math.min(viewportWidth, viewportHeight) / 2.1;

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
    toolPosition = pos;
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
    toolPosition = null;
    if (toolDraw && !toolDraw.done) toolDraw = null;
  };

  $: toCanvas = (z: Complex.Complex) =>
    Complex.add(
      Complex.scale(Complex.conj(z), unitSize),
      Complex.complex(viewportWidth / 2, viewportHeight / 2)
    );
</script>

<div class="layout">
  <div class="top">
    <div><input bind:value={cutRadius} type="number" step=".01" /></div>
    {JSON.stringify(toolPosition)}
  </div>
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
      {#if euclidean?.origin}
        {#each [...Graph.traverseDfs(euclidean.origin)] as node}
          <circle
            on:mouseenter={() => void (hoverCircle = node.id)}
            on:mouseleave={() => void (hoverCircle = null)}
            data-row={node.label.data.row}
            data-column={node.label.data.column}
            class:odd={node.label.data.row % 2}
            class:even={!(node.label.data.row % 2)}
            class:hover={node.id === hoverCircle}
            r={node.label.radius * unitSize}
            cx={node.label.position.x * unitSize + viewportWidth / 2}
            cy={-node.label.position.y * unitSize + viewportHeight / 2}
          />
        {/each}
      {/if}
    </svg>
  </div>
  <div
    class="sizer"
    bind:clientWidth={viewportWidth}
    bind:clientHeight={viewportHeight}
  >
    <svg width="100%" height="100%">
      <circle
        stroke="black"
        fill="none"
        cx={viewportWidth / 2}
        cy={viewportHeight / 2}
        r={unitSize}
      />
      {#if hyperbolic}
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
            class:odd={node.label.data.row % 2}
            class:even={!(node.label.data.row % 2)}
            class:hover={node.id === hoverCircle}
            cx={x}
            cy={y}
            {r}
          />
        {/each}
      {/if}
    </svg>
  </div>
</div>

<style lang="postcss">
  .layout {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-areas: "top top" "left right";
    grid-template-rows: auto 1fr;
    grid-template-columns: 1fr 1fr;
    padding: 2rem;
    gap: 2rem;
  }

  .top {
    grid-area: top;
  }

  svg {
    border: 1px solid gray;
  }

  circle {
    &.odd {
      fill: darkgray;
    }
    &.even {
      fill: gray;
    }
    &.hover {
      fill: green;
    }
  }
</style>
