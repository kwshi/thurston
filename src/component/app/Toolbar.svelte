<script lang="ts">
  import Slider from "$component/control/Slider.svelte";

  import { packingRadius } from "$store/parameter";
  import { tool, Mode } from "$store/tool";
  import { polygon } from "$store/polygon";
</script>

<div class="toolbar">
  <div class="mode">
    <button
      class:active={$tool.mode === Mode.Polygon}
      on:click={() => ($tool = { mode: Mode.Polygon, polygon: [] })}
      >set domain: polygon</button
    >
    <button
      class:active={$tool.mode === Mode.DomainSlit}
      on:click={() => ($tool = { mode: Mode.DomainSlit })}
    >
      set domain: slit
    </button>
    <button
      class:active={$tool.mode === Mode.DomainRectangle}
      on:click={() => ($tool = { mode: Mode.DomainRectangle })}
    >
      set domain: rectangle
    </button>
    <button
      class:active={$tool.mode === Mode.Anchor}
      on:click={() => ($tool = { mode: Mode.Anchor })}>adjust anchors</button
    >
    <button
      class:active={$tool.mode === Mode.Draw}
      on:click={() => ($tool = { mode: Mode.Draw })}>add drawings</button
    >
  </div>
  <div class="detail">
    {#if $tool.mode === Mode.Polygon}
      {@const toolPolygon = $tool.polygon}
      {@const reset = () => ($tool = { mode: Mode.Polygon, polygon: [] })}
      <button
        on:click={() => {
          $polygon = toolPolygon;
          reset();
        }}
        disabled={$tool.polygon.length < 3}>confirm</button
      >
      <button on:click={reset} disabled={!$tool.polygon.length}>reset</button>
    {/if}
    {#if $tool.mode === Mode.DomainSlit}
      {#if !$tool.slit}
        click a point to mark the center of the slit domain.
      {:else}
        click somewhere else to mark the endpoint of the slit.
      {/if}
    {/if}
    {#if $tool.mode === Mode.DomainRectangle}
      {#if !$tool.diagonal}
        click a point to mark the first corner of the rectangle.
      {:else}
        mark the second corner of the rectangle.
      {/if}
    {/if}
  </div>
  <Slider min={0.02} max={0.1} bind:value={$packingRadius} />
</div>

<style lang="postcss">
  .toolbar {
    grid-area: toolbar;
  }

  .mode {
    & > button {
      background: white;
      border: 1px solid gray;
      font: inherit;
      padding: 0.25em 0.75em;
      cursor: pointer;

      &.active {
        background: gray;
      }
    }
  }
</style>
