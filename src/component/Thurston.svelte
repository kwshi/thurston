<script lang="ts">
  import * as Graph from "$lib/graph";
  import * as Complex from "$lib/complex";
  import * as Pack from "$lib/pack";
  import * as Geometry from "$lib/hyperbolic";

  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  let hoverCircle: symbol | null = null;

  const enum ToolMode {
    Polygon,
    Normalize,
    DrawCurve,
  }

  let stuff = Graph.Example.rectangle(10, 30);
  let graph = stuff.graph;
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
</script>

<div class="layout">
  <div class="top" />
  <div>
    <svg width="100%" height="100%">
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
