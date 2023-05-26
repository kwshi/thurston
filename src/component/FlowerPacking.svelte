<script lang="ts">
  let input: string = "1 2 3";
  let viewportWidth: number = 1;
  let viewportHeight: number = 1;

  const parseInput = (s: string): number[] => {
    const tokens = s.matchAll(/\d+(?:\.\d*)?|\.\d+/g);
    const values: number[] = [];
    for (const thing of tokens) values.push(parseFloat(thing[0]));
    return values;
  };

  const cosineLaw = (a: number, b: number, c: number): number =>
    Math.acos((a * a + b * b - c * c) / (2 * a * b));

  const petalAngles = (r: number, petals: number[]): number[] => {
    const angles: number[] = [];
    for (let i = 0; i < petals.length; ++i) {
      const r1 = petals[i]!;
      const r2 = petals[(i + 1) % petals.length]!;
      angles.push(cosineLaw(r + r1, r + r2, r1 + r2));
    }
    return angles;
  };

  const advance = (r: number, petals: number[]): number => {
    let total = 0;
    for (const angle of petalAngles(r, petals)) total += angle;
    const halfAngle = total / petals.length / 2;
    const rUniform = r * (Math.sin(halfAngle) / (1 - Math.sin(halfAngle)));

    return (
      rUniform *
      (Math.sqrt(2 / (1 - Math.cos((2 * Math.PI) / petals.length))) - 1)
    );
  };

  const iterate = (r: number, petals: number[], iterations: number): number => {
    for (let i = 0; i < iterations; ++i) r = advance(r, petals);
    return r;
  };

  const accumulate = (angles: number[]): number[] => {
    const totals: number[] = [0];
    for (const angle of angles) totals.push(totals[totals.length - 1]! + angle);
    return totals;
  };

  $: petals = parseInput(input);
  $: radius = petals.length < 3 ? 1 : iterate(1, petals, 8);
  $: angles = accumulate(petalAngles(radius, petals));
  $: size = radius + 2 * Math.max(...petals);

  $: scale = Math.min(viewportWidth, viewportHeight) / size / 2;
</script>

<div class="root">
  <input bind:value={input} />
  <div
    class="sizer"
    bind:clientWidth={viewportWidth}
    bind:clientHeight={viewportHeight}
  >
    <svg class="viewport" width="100%" height="100%">
      <g transform="translate({viewportWidth / 2},{viewportHeight / 2})">
        <g transform="scale({scale})">
          <circle cx="0" cy="0" r={radius} fill="black" />
        </g>
        {#each petals as r, i}
          {@const θ = angles[i] ?? 0}
          {@const s = radius + r}
          {@const x = s * Math.cos(θ)}
          {@const y = -s * Math.sin(θ)}
          <g transform="translate({scale * x},{scale * y})">
            <circle r={scale * r} fill="green" />
            <text
              fill="white"
              font-weight="bold"
              font-size="{Math.min((scale * r) / 16, 1.5) * 1}rem"
              text-anchor="middle"
              dominant-baseline="middle"
              {x}
              {y}>{r}</text
            >
          </g>
        {/each}
      </g>
    </svg>
  </div>
</div>

<style lang="pcss">
  div.root {
    display: grid;
    max-width: 64rem;
    margin: 0 auto;
    grid-template-rows: auto 1fr;
    position: absolute;
    inset: 0;
  }

  div.sizer {
    overflow-y: hidden;
  }

  input {
  }

  svg.viewport {
    position: absolute;
    inset: 0;
  }
</style>
