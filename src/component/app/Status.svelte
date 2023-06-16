<script lang="ts">
  import { tool, Mode } from "$store/tool";
  import { domain, drawings } from "$store/polygon";
</script>

<div class="detail">
  {#if $tool.mode === Mode.Polygon}
    {@const toolPolygon = $tool.polygon}
    {@const reset = () => ($tool = { mode: Mode.Polygon, polygon: [] })}
    click and drag to draw the boundary of the polygon. click “confirm” when done.
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
      click somewhere else to mark the second corner of the rectangle.
    {/if}
  {/if}
  {#if $tool.mode === Mode.Draw}
    click and drag to draw.
    <button on:click={() => void ($drawings = [])}>clear all drawings</button>
    <button on:click={() => void ($drawings = $drawings.slice(0, -1))}
      >undo last drawing</button
    >
  {/if}
  {#if $tool.mode === Mode.AnchorZero}
    click a point in the left pane to fix a point to send to zero. drag to move
    the point.
  {/if}
  {#if $tool.mode === Mode.AnchorAxis}
    click a point in the left pane to fix a point to send to the positive real
    axis. drag to move the point.
  {/if}
</div>
