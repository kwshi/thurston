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
