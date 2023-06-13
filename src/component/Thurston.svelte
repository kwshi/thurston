<script lang="ts">
  import * as Graph from "$lib/graph";
  import * as Complex from "$lib/complex";
  import * as Pack from "$lib/pack";
  import * as Geometry from "$lib/hyperbolic";
  import * as Cut from "$lib/cut";
  import * as Misc from "$lib/misc";

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

  const cutRadius = 0.1;
  $: pts = toolDraw?.done ? Cut.cutThick(toolDraw.polygon, cutRadius) : null;
  $: console.log(toolDraw?.polygon);
  toolDraw = {
    done: true,
    polygon: [
      {
        x: -0.3975000000000001,
        y: 1.9275000000000002,
      },
      {
        x: -0.42750000000000005,
        y: 1.9350000000000003,
      },
      {
        x: -0.5100000000000001,
        y: 1.9275000000000002,
      },
      {
        x: -0.6075,
        y: 1.8375000000000004,
      },
      {
        x: -0.6900000000000001,
        y: 1.6950000000000003,
      },
      {
        x: -0.8175000000000001,
        y: 1.2975,
      },
      {
        x: -0.8925000000000002,
        y: 0.33000000000000007,
      },
      {
        x: -0.8250000000000001,
        y: -0.36750000000000005,
      },
      {
        x: -0.7050000000000001,
        y: -0.8625000000000002,
      },
      {
        x: -0.5700000000000001,
        y: -1.11,
      },
      {
        x: -0.23250000000000004,
        y: -1.2600000000000002,
      },
      {
        x: 0.10500000000000001,
        y: -1.0575,
      },
      {
        x: 0.525,
        y: -0.36000000000000004,
      },
      {
        x: 0.6375000000000001,
        y: 0.21000000000000002,
      },
      {
        x: 0.6300000000000001,
        y: 0.7800000000000001,
      },
      {
        x: 0.6075,
        y: 0.9000000000000001,
      },
      {
        x: 0.38250000000000006,
        y: 1.5975000000000001,
      },
      {
        x: 0.36750000000000005,
        y: 1.6200000000000003,
      },
    ],
  };

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
        <!--
        {#each [...Misc.adjacentPairs(toolDraw.polygon)] as seg}
          {@const s = Cut.widenSegment(seg, cutRadius)}
          {@const zo = toCanvas(seg[0])}
          {@const wo = toCanvas(seg[1])}
          <line stroke="purple" x1={zo.x} y1={zo.y} x2={wo.x} y2={wo.y} />
          {#if s}
            {@const z = toCanvas(s[0][0])}
            {@const w = toCanvas(s[0][1])}
            <line stroke="magenta" x1={z.x} y1={z.y} x2={w.x} y2={w.y} />
            {@const zz = toCanvas(s[1][0])}
            {@const ww = toCanvas(s[1][1])}
            <line stroke="teal" x1={zz.x} y1={zz.y} x2={ww.x} y2={ww.y} />
          {/if}
        {/each}
        -->
      {/if}
      {#if pts}
        {#each pts.crosses as pt}
          {@const p = toCanvas(pt)}
          <circle cx={p.x} cy={p.y} r={3} opacity={0.25} fill="green" />
        {/each}
        {#each pts.walls as pt}
          {@const [p, q] = pt.map(toCanvas)}
          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="orange" />
          <circle cx={p.x} cy={p.y} r={2} stroke="purple" opacity=".25" />
          <circle cx={q.x} cy={q.y} r={2} stroke="blue" opacity=".25" />
        {/each}

        <!--
        {#each pts.whee as pt}
          {@const p = toCanvas(pt)}
          <circle
            cx={p.x}
            cy={p.y}
            r={(cutRadius / 8) * unitSize}
            fill="green"
          />
        {/each}
        -->
        {#each pts.stuff as pt}
          {@const p = toCanvas(pt)}
          <circle
            cx={p.x}
            cy={p.y}
            r={(cutRadius / 4) * 4 * unitSize}
            fill="blue"
            opacity=".25"
          />
        {/each}
      {/if}
      <!--
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
      -->
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
