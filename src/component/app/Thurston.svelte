<script lang="ts">
  import * as Graph from "$lib/graph";
  import * as Complex from "$lib/complex";
  import * as Polygon from "$lib/polygon";
  import * as Geometry from "$lib/geometry";
  import * as Segment from "$lib/segment";

  import Toolbar from "$component/app/Toolbar.svelte";
  import Status from "$component/app/Status.svelte";

  import { tool, position, Mode } from "$store/tool";
  import { domain, packing, drawings, mappedDrawings } from "$store/polygon";

  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  let hoverCircle: symbol | null = null;

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
    $position = pos;
    switch ($tool.mode) {
      case Mode.Polygon:
        $tool = { mode: Mode.Polygon, polygon: [...$tool.polygon, pos] };
        return;

      case Mode.DomainSlit: {
        if (!$tool.slit) {
          $tool = { ...$tool, slit: [pos, pos] };
          return;
        }
        const [a, b] = $tool.slit;
        const ray = Complex.sub(b, a);
        $domain = {
          polygon: Polygon.sector($tool.slit, 2 * Math.PI, 64),
          zero: Complex.sub(a, Complex.scaleInv(ray, 2)),
          axis: Complex.sub(a, Complex.scale(ray, 3 / 4)),
        };
        $tool = { mode: Mode.DomainSlit };
        return;
      }

      case Mode.DomainRectangle:
        if (!$tool.diagonal) {
          $tool = { ...$tool, diagonal: [pos, pos] };
          return;
        }
        const [a, b] = $tool.diagonal;
        $domain = {
          polygon: Polygon.rectangle($tool.diagonal),
          zero: Complex.scaleInv(Complex.add(a, b), 2),
          axis: Complex.complex(
            (a.x + b.x + Math.abs(a.x - b.x) / 2) / 2,
            (a.y + b.y) / 2
          ),
        };
        $tool = { mode: Mode.DomainRectangle };
        return;

      case Mode.DomainHalfDisk: {
        if (!$tool.ray) {
          $tool = { ...$tool, ray: [pos, pos] };
          return;
        }
        const [a, b] = $tool.ray;
        const arm = Complex.sub(b, a);
        $domain = {
          polygon: Polygon.sector(
            [a, Complex.add(a, Complex.mul(arm, Complex.neg(Complex.i)))],
            Math.PI,
            64
          ),
          zero: Complex.add(a, Complex.scaleInv(arm, 2)),
          axis: Complex.add(a, Complex.scale(arm, 3 / 4)),
        };
        $tool = { mode: Mode.DomainHalfDisk };
        return;
      }

      case Mode.Draw:
        $tool = { ...$tool, drawing: [pos] };
        return;

      case Mode.AnchorZero:
        $domain = { ...$domain, zero: pos };
        return;

      case Mode.AnchorAxis:
        $domain = { ...$domain, axis: pos };
        return;
    }
  };

  const mouseMove = (ev: MouseEvent) => {
    const pos = getPosition(ev, unitSize);
    $position = pos;

    switch ($tool.mode) {
      case Mode.Polygon:
        if (!$tool.polygon.length || !(ev.buttons & 1)) return;
        $tool = { mode: Mode.Polygon, polygon: [...$tool.polygon, pos] };
        return;

      case Mode.DomainSlit:
        if (!$tool.slit) return;
        const [center] = $tool.slit;
        $tool = { ...$tool, slit: [center, pos] };
        return;

      case Mode.DomainRectangle:
        if (!$tool.diagonal) return;
        const [z] = $tool.diagonal;
        $tool = { ...$tool, diagonal: [z, pos] };
        return;

      case Mode.DomainHalfDisk: {
        if (!$tool.ray) return;
        const [z] = $tool.ray;
        $tool = { ...$tool, ray: [z, pos] };
        return;
      }

      case Mode.Draw:
        if (!$tool.drawing.length) return;
        $tool = { ...$tool, drawing: [...$tool.drawing, pos] };
        return;

      case Mode.AnchorZero:
        if (!(ev.buttons & 1)) return;
        $domain = { ...$domain, zero: pos };
        return;

      case Mode.AnchorAxis:
        if (!(ev.buttons & 1)) return;
        $domain = { ...$domain, axis: pos };
        return;
    }
  };

  const mouseUp = () => {
    switch ($tool.mode) {
      case Mode.Polygon:
        return;

      case Mode.Draw:
        $drawings = [...$drawings, $tool.drawing];
        $tool = { ...$tool, drawing: [] };
    }
  };

  const mouseLeave = () => {
    $position = null;
  };

  $: toCanvas = (z: Complex.Complex) =>
    Complex.add(
      Complex.scale(Complex.conj(z), unitSize),
      Complex.complex(viewportWidth / 2, viewportHeight / 2)
    );

  $: zero = toCanvas($domain.zero);
  $: axis = toCanvas($domain.axis);
</script>

<div class="layout">
  <Toolbar />
  <div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      on:mousedown={mouseDown}
      on:mouseup={mouseUp}
      on:mousemove={mouseMove}
      on:mouseleave={mouseLeave}
    >
      <path class="domain" d={Polygon.toPathD($domain.polygon.map(toCanvas))} />
      {#if $packing}
        <path
          class="triangulation"
          d={Polygon.toPathD(
            Graph.findBoundary($packing.euclideanGraph)
              .map((node) => node.label.position)
              .map(toCanvas)
          ) +
            [...Graph.traverseDfsEdges($packing.euclideanGraph)]
              .map(({ node, parent }) =>
                Segment.pathD([
                  toCanvas(node.label.position),
                  toCanvas(parent.label.position),
                ])
              )
              .join("")}
        />

        {#each [...Graph.traverseDfs($packing.euclideanGraph)] as node}
          <circle
            class="pack"
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

      <circle cx={zero.x} cy={zero.y} r={3} fill="blue" />
      <circle cx={axis.x} cy={axis.y} r={3} fill="cyan" />

      {#each $drawings as curve}
        <path
          d={Polygon.toPathD(curve.map(toCanvas), false)}
          stroke-width="2"
          stroke="var(--drawing-stroke)"
          fill="none"
        />
      {/each}
      {#if $tool.mode === Mode.Polygon}
        <path
          d={Polygon.toPathD($tool.polygon.map(toCanvas), false)}
          stroke="green"
          fill="rgba(0,128,0,.1)"
        />
        {#each $tool.polygon as z}
          {@const p = toCanvas(z)}
          <circle cx={p.x} cy={p.y} r={2} />
        {/each}
      {/if}
      {#if $tool.mode === Mode.DomainRectangle}
        {#if $tool.diagonal}
          {@const [z, w] = $tool.diagonal}
          {@const c = toCanvas(z)}
          {@const e = toCanvas(w)}
          <rect
            stroke="green"
            x={Math.min(c.x, e.x)}
            y={Math.min(c.y, e.y)}
            width={Math.abs(c.x - e.x)}
            height={Math.abs(c.y - e.y)}
            fill="none"
          />
        {/if}
      {/if}

      {#if $tool.mode === Mode.DomainSlit}
        {#if $tool.slit}
          {@const [z, w] = $tool.slit}
          {@const c = toCanvas(z)}
          {@const e = toCanvas(w)}
          {@const r = unitSize * Complex.dist(z, w)}
          <circle
            cx={c.x}
            cy={c.y}
            {r}
            fill="rgba(0,128,0,.1)"
            stroke="green"
          />
          <line stroke="green" x1={c.x} y1={c.y} x2={e.x} y2={e.y} />
        {/if}
      {/if}

      {#if $tool.mode === Mode.DomainHalfDisk}
        {#if $tool.ray}
          {@const [z, w] = $tool.ray}
          {@const a = Complex.mul(Complex.i, Complex.sub(w, z))}
          {@const start = toCanvas(Complex.sub(z, a))}
          {@const end = toCanvas(Complex.add(z, a))}
          {@const r = unitSize * Complex.dist(z, w)}
          <path
            d="M{start.x} {start.y}A{r} {r} 0 0 0 {end.x} {end.y} Z"
            fill="rgba(0,128,0,.1)"
            stroke="green"
          />
        {/if}
      {/if}

      {#if $tool.mode === Mode.Draw && $tool.drawing}
        <path
          d={Polygon.toPathD($tool.drawing.map(toCanvas), false)}
          stroke="magenta"
          fill="none"
        />
      {/if}
    </svg>
  </div>
  <div
    class="sizer"
    bind:clientWidth={viewportWidth}
    bind:clientHeight={viewportHeight}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle
        class="domain"
        cx={viewportWidth / 2}
        cy={viewportHeight / 2}
        r={unitSize}
      />
      {#if $packing}
        <path
          class="triangulation"
          d={Polygon.toPathD(
            Graph.findBoundary($packing.hyperbolicGraph)
              .map(
                (node) =>
                  Geometry.hyperbolicCircleToEuclidean(
                    node.label.position,
                    node.label.radius
                  ).center
              )
              .map(toCanvas)
          ) +
            [...Graph.traverseDfsEdges($packing.hyperbolicGraph)]
              .map(({ node, parent }) =>
                Segment.pathD([
                  toCanvas(
                    Geometry.hyperbolicCircleToEuclidean(
                      node.label.position,
                      node.label.radius
                    ).center
                  ),
                  toCanvas(
                    Geometry.hyperbolicCircleToEuclidean(
                      parent.label.position,
                      parent.label.radius
                    ).center
                  ),
                ])
              )
              .join("")}
        />

        {#each [...Graph.traverseDfs($packing.hyperbolicGraph)] as node}
          {@const circle = Geometry.hyperbolicCircleToEuclidean(
            node.label.position,
            node.label.radius
          )}
          {@const center = toCanvas(circle.center)}
          <circle
            class="pack"
            on:mouseenter={() => void (hoverCircle = node.id)}
            on:mouseleave={() => void (hoverCircle = null)}
            class:odd={node.label.data.row % 2}
            class:even={!(node.label.data.row % 2)}
            class:hover={node.id === hoverCircle}
            cx={center.x}
            cy={center.y}
            r={circle.radius * unitSize}
          />
        {/each}

        {#if $position && ($tool.mode === Mode.Draw || $tool.mode === Mode.AnchorZero || $tool.mode === Mode.AnchorAxis)}
          {@const w = $packing.mapPoint($position)}
          {#if w}
            {@const p = toCanvas(w)}
            <circle cx={p.x} cy={p.y} r={3} fill="red" />
          {/if}
        {/if}
        {#if $tool.mode === Mode.Draw}
          {#if $tool.drawing}
            <path
              d={$packing
                .mapDrawing($tool.drawing)
                .map((curve) => Polygon.toPathD(curve.map(toCanvas), false))
                .join("")}
              stroke="magenta"
              fill="none"
            />
          {/if}
        {/if}
        {@const zeroH = $packing.mapPoint($domain.zero)}
        {@const axisH = $packing.mapPoint($domain.axis)}
        {@const zeroHC = zeroH ? toCanvas(zeroH) : null}
        {@const axisHC = axisH ? toCanvas(axisH) : null}
        {#if zeroHC && axisHC}
          <circle cx={zeroHC.x} cy={zeroHC.y} r={3} fill="blue" />
          <circle cx={axisHC.x} cy={axisHC.y} r={3} fill="cyan" />
        {/if}
      {/if}
      {#each $mappedDrawings as drawing}
        <path
          d={Polygon.toPathD(drawing.map(toCanvas), false)}
          stroke-width="2"
          stroke="var(--drawing-stroke)"
          fill="none"
        />
      {/each}
    </svg>
  </div>
  <div class="status">
    <Status />
  </div>
</div>

<style lang="postcss">
  .layout {
    display: grid;
    grid-template-areas: "toolbar toolbar" "left right" "status status";
    grid-template-rows: auto 1fr 4rem;
    grid-template-columns: 1fr 1fr;
    padding: 0 1rem 1rem 1rem;
    gap: 1rem;

    & > .status {
      grid-area: status;
    }
  }

  svg {
    border: 1px solid var(--canvas-border-color);
    background-color: var(--canvas-bg);
  }

  .domain {
    fill: var(--domain-fill);
    stroke: var(--domain-stroke);
    stroke-width: 1.5px;
  }

  .triangulation {
    fill: var(--triangulation-fill);
    stroke: var(--triangulation-stroke);
    stroke-width: 1.5px;
  }

  circle.pack {
    &.odd {
      fill: var(--circle-odd-fill);
    }
    &.even {
      fill: var(--circle-even-fill);
    }
    &.hover {
      fill: var(--circle-hover-fill);
    }
  }
</style>
