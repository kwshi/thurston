export const cosineLaw = (a: number, b: number, c: number): number =>
  Math.acos((a * a + b * b - c * c) / (2 * a * b));

export const petalAngles = (r: number, petals: number[]): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < petals.length; ++i) {
    const r1 = petals[i]!;
    const r2 = petals[(i + 1) % petals.length]!;
    angles.push(cosineLaw(r + r1, r + r2, r1 + r2));
  }
  return angles;
};

export const adjustFlower = (r: number, petals: number[]): number => {
  let total = 0;
  for (const angle of petalAngles(r, petals)) total += angle;
  const halfAngle = total / petals.length / 2;
  const rUniform = r * (Math.sin(halfAngle) / (1 - Math.sin(halfAngle)));

  return (
    rUniform *
    (Math.sqrt(2 / (1 - Math.cos((2 * Math.PI) / petals.length))) - 1)
  );
};

export const getHyperAngle = (v: number, u: number, w: number) =>
  2 *
  Math.asin(Math.sqrt(v * ((1 - u) / (1 - v * u)) * ((1 - w) / (1 - v * w))));

export const petalAnglesHyperbolic = (
  r: number,
  petals: number[]
): number[] => {
  const angles: number[] = [];
  for (let i = 0; i < petals.length; ++i) {
    const r1 = petals[i]!;
    const r2 = petals[(i + 1) % petals.length]!;
    angles.push(getHyperAngle(r, r1, r2));
  }
  return angles;
};

export const adjustFlowerHyperbolic = (v: number, petals: number[]) => {
  let θ = 0;
  for (const α of petalAnglesHyperbolic(v, petals)) θ += α;

  const β = Math.sin(θ / 2 / petals.length);
  const δ = Math.sin(Math.PI / petals.length);
  const v̂ = Math.max(0, (β - Math.sqrt(v)) / (β * v - Math.sqrt(v)));
  const t = (2 * δ) / (Math.sqrt((1 - v̂) * (1 - v̂) + 4 * δ * δ * v̂) + (1 - v̂));
  return t * t;
};
