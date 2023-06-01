export const petalAngleE = (v: number, u: number, w: number) =>
  2 * Math.asin(Math.sqrt((u / (v + u)) * (w / (v + w))));

export const petalAngleH = (v: number, u: number, w: number) =>
  2 *
  Math.asin(Math.sqrt(v * ((1 - u) / (1 - v * u)) * ((1 - w) / (1 - v * w))));

export const petalAngles =
  (petalAngle: (v: number, u: number, w: number) => number) =>
  (r: number, petals: number[]): number[] => {
    const angles: number[] = [];
    for (let i = 0; i < petals.length; ++i) {
      const r1 = petals[i]!;
      const r2 = petals[(i + 1) % petals.length]!;
      angles.push(petalAngle(r, r1, r2));
    }
    return angles;
  };
