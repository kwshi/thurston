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

  let cutRadius = 0.03;
  $: pts = toolDraw?.done ? Cut.cutThick(toolDraw.polygon, cutRadius) : null;
  $: console.log(toolDraw?.polygon);
  toolDraw = {
    done: true,
    polygon: [
      {
        x: -0.040645161290322585,
        y: 0.5509677419354839,
      },
      {
        x: -0.040645161290322585,
        y: 0.6074193548387097,
      },
      {
        x: -0.049677419354838714,
        y: 0.6164516129032258,
      },
      {
        x: -0.0767741935483871,
        y: 0.6322580645161291,
      },
      {
        x: -0.07903225806451614,
        y: 0.6322580645161291,
      },
      {
        x: -0.16483870967741937,
        y: 0.6412903225806452,
      },
      {
        x: -0.2935483870967742,
        y: 0.63,
      },
      {
        x: -0.3816129032258065,
        y: 0.5983870967741935,
      },
      {
        x: -0.4606451612903226,
        y: 0.5532258064516129,
      },
      {
        x: -0.4719354838709678,
        y: 0.5419354838709678,
      },
      {
        x: -0.5374193548387097,
        y: 0.46290322580645166,
      },
      {
        x: -0.5825806451612904,
        y: 0.34322580645161294,
      },
      {
        x: -0.5870967741935484,
        y: 0.25516129032258067,
      },
      {
        x: -0.5645161290322581,
        y: 0.16935483870967744,
      },
      {
        x: -0.5170967741935484,
        y: 0.0835483870967742,
      },
      {
        x: -0.5103225806451613,
        y: 0.0767741935483871,
      },
      {
        x: -0.43580645161290327,
        y: 0,
      },
      {
        x: -0.33645161290322584,
        y: -0.05193548387096775,
      },
      {
        x: -0.2641935483870968,
        y: -0.08806451612903227,
      },
      {
        x: -0.22129032258064518,
        y: -0.12870967741935485,
      },
      {
        x: -0.1941935483870968,
        y: -0.1806451612903226,
      },
      {
        x: -0.1874193548387097,
        y: -0.2370967741935484,
      },
      {
        x: -0.1874193548387097,
        y: -0.24161290322580647,
      },
      {
        x: -0.20322580645161292,
        y: -0.3274193548387097,
      },
      {
        x: -0.22129032258064518,
        y: -0.3951612903225807,
      },
      {
        x: -0.22354838709677421,
        y: -0.43354838709677423,
      },
      {
        x: -0.22129032258064518,
        y: -0.4674193548387097,
      },
      {
        x: -0.20548387096774196,
        y: -0.4945161290322581,
      },
      {
        x: -0.19870967741935486,
        y: -0.5012903225806452,
      },
      {
        x: -0.12419354838709679,
        y: -0.5396774193548387,
      },
      {
        x: -0.011290322580645162,
        y: -0.555483870967742,
      },
      {
        x: 0.14225806451612905,
        y: -0.5509677419354839,
      },
      {
        x: 0.2574193548387097,
        y: -0.5216129032258064,
      },
      {
        x: 0.25967741935483873,
        y: -0.5216129032258064,
      },
      {
        x: 0.40645161290322585,
        y: -0.41322580645161294,
      },
      {
        x: 0.4538709677419355,
        y: -0.3116129032258065,
      },
      {
        x: 0.4674193548387097,
        y: -0.1603225806451613,
      },
      {
        x: 0.4651612903225807,
        y: -0.11516129032258066,
      },
      {
        x: 0.44709677419354843,
        y: -0.013548387096774195,
      },
      {
        x: 0.40645161290322585,
        y: 0.1038709677419355,
      },
      {
        x: 0.35903225806451616,
        y: 0.1874193548387097,
      },
      {
        x: 0.31612903225806455,
        y: 0.2438709677419355,
      },
      {
        x: 0.29580645161290325,
        y: 0.26193548387096777,
      },
      {
        x: 0.2935483870967742,
        y: 0.2641935483870968,
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
        <!--
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
