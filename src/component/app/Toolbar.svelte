<script lang="ts">
  import Slider from "$component/control/Slider.svelte";

  import { packingRadius } from "$store/parameter";
  import { tool, Mode } from "$store/tool";
  import { domain, drawings } from "$store/polygon";
</script>

<div class="toolbar">
  <div class="control">
    circle packing resolution: <Slider
      min={0.02}
      max={0.1}
      bind:value={$packingRadius}
    />
  </div>
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
</div>

<style lang="postcss">
  .toolbar {
    grid-area: toolbar;
    display: grid;
    row-gap: 0.5em;
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
