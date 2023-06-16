<script lang="ts">
  export let min: number;
  export let max: number;

  export let value: number;

  let sliderWidth = 1;

  $: percent = ((value - min) / (max - min)) * 100;

  let start: { value: number; position: number } | null = null;

  const normalize = (x: number) =>
    Math.min(max, Math.max(min, Math.round(x * 1000) / 1000));

  const startDrag = (event: MouseEvent) =>
    void (start = { position: event.pageX, value });

  const stopDrag = () => void (start = null);

  const mouseMove = (event: MouseEvent) => {
    if (!start) return;
    value = normalize(
      start.value + ((event.pageX - start.position) / sliderWidth) * (max - min)
    );
  };
</script>

<svelte:window
  on:mouseup={stopDrag}
  on:mouseleave={stopDrag}
  on:mousemove={mouseMove}
/>
<div class="slider" bind:clientWidth={sliderWidth}>
  <div class="track">
    <div class="handle" style:left="{percent}%" on:mousedown={startDrag} />
  </div>
  <div class="value">{value}</div>
</div>

<style lang="postcss">
  .slider {
    display: inline-grid;
    margin: 0 0.5em;
    grid-template-columns: auto auto;
    column-gap: 0.5em;
    align-items: baseline;
  }

  .track {
    position: relative;
    width: 8rem;
    cursor: pointer;
    align-self: center;

    &::before {
      content: "";
      position: absolute;
      display: block;
      background-color: gray;
      width: 100%;
      top: 50%;

      border-radius: 0.125em;
      height: 0.25em;
      margin-top: -0.125em;
    }
  }

  .handle {
    background-color: white;
    border: 1px solid black;
    position: absolute;
    top: 50%;
    align-items: baseline;

    width: 0.75em;
    height: 0.75em;
    border-radius: 0.375em;
    margin-top: -0.375em;
    margin-left: -0.375em;
  }

  .value {
    user-select: none;
  }
</style>
