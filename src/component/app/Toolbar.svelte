<script lang="ts">
  import Slider from "$component/control/Slider.svelte";
  import * as Complex from "$lib/complex";

  import { packingRadius } from "$store/parameter";
  import { tool, position, Mode } from "$store/tool";
  import { domain, packing, drawings } from "$store/polygon";
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
      class:active={$tool.mode === Mode.AnchorZero}
      on:click={() => ($tool = { mode: Mode.AnchorZero })}
      >change zero anchor</button
    >
    <button
      class:active={$tool.mode === Mode.AnchorAxis}
      on:click={() => ($tool = { mode: Mode.AnchorAxis })}
      >change positive-real anchor</button
    >

    <button
      class:active={$tool.mode === Mode.Draw}
      on:click={() => ($tool = { mode: Mode.Draw, drawing: [] })}
      >add drawings</button
    >
  </div>
  <div class="detail">
    {#if $tool.mode === Mode.Polygon}
      {@const toolPolygon = $tool.polygon}
      {@const reset = () => ($tool = { mode: Mode.Polygon, polygon: [] })}
      <button
        on:click={() => {
          $domain = { ...$domain, polygon: toolPolygon };
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
    {#if $tool.mode === Mode.Draw}
      <button on:click={() => void ($drawings = [])}>clear all drawings</button>
      <button on:click={() => void ($drawings = $drawings.slice(0, -1))}
        >undo last drawing</button
      >
    {/if}
    {#if $tool.mode === Mode.AnchorZero}
      click a point in the left pane to fix a point to send to zero. drag to
      move the point.
    {/if}
    {#if $tool.mode === Mode.AnchorAxis}
      click a point in the left pane to fix a point to send to the positive real
      axis. drag to move the point.
    {/if}
  </div>
  <div class="status" />
  <Slider min={0.02} max={0.1} bind:value={$packingRadius} />
</div>

<style lang="postcss">
  .toolbar {
    grid-area: toolbar;
  }

  .mode {
    display: flex;

    & > button {
      & + button {
        margin-left: 0.5em;
      }
      background: white;
      border: 1px solid lightgray;
      font: inherit;
      padding: 0.125em 0.5em;
      line-height: 1.25em;
      font-size: 0.875em;
      cursor: pointer;

      &.active {
        background: lightgray;
      }
    }
  }
</style>
