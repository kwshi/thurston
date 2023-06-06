export const petalAngleE = (v: number, u: number, w: number) =>
  2 * Math.asin(Math.sqrt((u / (v + u)) * (w / (v + w))));

export const petalAngleH = (v: number, u: number, w: number) =>
  2 *
  Math.asin(Math.sqrt(v * ((1 - u) / (1 - v * u)) * ((1 - w) / (1 - v * w))));

export const petalAngles = (
  petalAngle: (v: number, u: number, w: number) => number,
  r: number,
  petals: number[]
): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < petals.length; ++i) {
    const r1 = petals[i]!;
    const r2 = petals[(i + 1) % petals.length]!;
    angles.push(petalAngle(r, r1, r2));
  }
  return angles;
};

export const angleSum = (
  petalAngle: (v: number, u: number, w: number) => number,
  r: number,
  petals: number[]
): number => {
  let sum = 0;
  for (const angle of petalAngles(petalAngle, r, petals)) sum += angle;
  return sum;
};

export const relaxFlowerE = (v: number, petals: number[]) => {
  const θ = angleSum(petalAngleE, v, petals);
  const β = Math.sin(θ / 2 / petals.length);
  const δ = Math.sin(Math.PI / petals.length);
  const v̂ = (β / (1 - β)) * v;
  return ((1 - δ) / δ) * v̂;
};

export const relaxFlowerH = (v: number, petals: number[]) => {
  const θ = angleSum(petalAngleH, v, petals);

  const β = Math.sin(θ / 2 / petals.length);
  const δ = Math.sin(Math.PI / petals.length);
  const v̂ = Math.max(0, (β - Math.sqrt(v)) / (β * v - Math.sqrt(v)));
  const t = (2 * δ) / (Math.sqrt((1 - v̂) * (1 - v̂) + 4 * δ * δ * v̂) + (1 - v̂));
  return t * t;
};
