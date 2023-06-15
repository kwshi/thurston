<script lang="ts">
  export let min: number;
  export let max: number;

  export let value: number;

  $: percent = ((value - min) / (max - min)) * 100;

  type DivMouseEvent = MouseEvent & { currentTarget: HTMLDivElement };

  let active = false;
  const setValue = (event: DivMouseEvent) =>
    (value =
      Math.round(
        (min +
          (event.offsetX / event.currentTarget.offsetWidth) * (max - min)) *
          1000
      ) / 1000);

  const mouseDown = (event: DivMouseEvent) => {
    active = true;
    setValue(event);
  };
  const mouseUp = () => void (active = false);
  const mouseMove = (event: DivMouseEvent) => void (active && setValue(event));
</script>

<div
  class="slider"
  on:mousedown={mouseDown}
  on:mouseup={mouseUp}
  on:mouseleave={mouseUp}
  on:mousemove={mouseMove}
  style:background-image="linear-gradient(to right,#ccc {percent}%,#eee {percent}%)"
>
  {value}
</div>

<style lang="postcss">
  .slider {
    width: 8rem;
    position: relative;

    user-select: none;
    text-align: center;
  }
</style>
