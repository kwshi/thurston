import * as Complex from "$lib/complex";
import * as Interval from "$lib/interval";

export type Segment = readonly [Complex.Complex, Complex.Complex];

export const pathD = ([z, w]: Segment) => `M${z.x} ${z.y}L${w.x} ${w.y}`;

export const map = (
  [z1, z2]: Segment,
  f: (z: Complex.Complex) => Complex.Complex
): Segment => [f(z1), f(z2)];

export const shift = (s: Segment, shift: Complex.Complex) =>
  map(s, (z) => Complex.add(z, shift));

export const thicken = (segment: Segment, radius: number) => {
  const [z, w] = segment;
  if (Complex.eq(z, w)) return null;
  const direction = Complex.mul(
    Complex.normalize(Complex.sub(w, z)),
    Complex.fromIm(radius)
  );
  return [
    shift(segment, direction),
    shift(segment, Complex.neg(direction)),
  ] as const;
};

export const intersectHorizontal = (
  [z, w]: Segment,
  y: number
): number | null => {
  const dy = w.y - z.y;
  if (!dy) return null;

  const t = (y - z.y) / dy;
  // half-open interval to avoid double-intersection edge cases:
  // that is, if the `y` value exactly passes through the vertex
  // joining two segments, only one of them should count
  return 0 <= t && t < 1 ? (1 - t) * z.x + t * w.x : null;
};

export const project = (
  [a, b]: Segment,
  z: Complex.Complex
): Complex.Complex => {
  if (Complex.eq(a, b)) return a;

  const ab = Complex.sub(b, a);
  const az = Complex.sub(z, a);
  const t = Complex.dot(az, ab) / Complex.abs2(ab);

  return Complex.add(a, Complex.scale(ab, t));
};

export const pointDistance = ([a, b]: Segment, z: Complex.Complex): number => {
  if (Complex.eq(a, b)) return Complex.dist(a, z);

  const ab = Complex.sub(b, a);
  const az = Complex.sub(z, a);
  const t = Complex.dot(az, ab) / Complex.abs2(ab);

  return 0 <= t && t <= 1
    ? Complex.dist(Complex.add(a, Complex.scale(ab, t)), z)
    : Math.min(Complex.dist(a, z), Complex.dist(b, z));
};

const ballWidth = (y1: number, y2: number, radius: number) => {
  const h = Math.abs(y1 - y2);
  return h > radius ? null : Math.sqrt(radius * radius - h * h);
};

export const thickIntersect = (
  segment: Segment,
  radius: number,
  y: number
): { interval: Interval.Interval; cross: number | null } | null => {
  const [z1, z2] = segment;

  const w1 = ballWidth(z1.y, y, radius);
  const w2 = ballWidth(z2.y, y, radius);

  const intercepts: number[] = [];
  if (w1) intercepts.push(z1.x - w1, z1.x + w1);
  if (w2) intercepts.push(z2.x - w2, z2.x + w2);

  const thick = thicken(segment, radius)!;
  if (thick) {
    const [seg, see] = thick;
    const segX = intersectHorizontal(seg, y);
    const seeX = intersectHorizontal(see, y);
    if (segX !== null) intercepts.push(segX);
    if (seeX !== null) intercepts.push(seeX);
  }

  const interval = Interval.hull(intercepts);
  return interval ? { interval, cross: intersectHorizontal(segment, y) } : null;
};
