export type Complex = { readonly x: number; readonly y: number };

export const complex = (x: number, y: number): Complex =>
  Object.freeze({ x, y });
export const polar = (r: number, t: number): Complex =>
  complex(r * Math.cos(t), r * Math.sin(t));

export const zero = complex(0, 0);
export const one = complex(1, 0);
export const i = complex(0, 1);
export const e = complex(Math.E, 0);
export const fromRe = (x: number) => complex(x, 0);
export const fromIm = (y: number) => complex(0, y);

export const abs2 = (a: Complex) => a.x * a.x + a.y * a.y;
export const abs = (a: Complex) => Math.sqrt(abs2(a));

export const neg = (a: Complex) => complex(-a.x, -a.y);
export const scale = (a: Complex, s: number) => complex(s * a.x, s * a.y);
export const scaleInv = (a: Complex, s: number) => complex(a.x / s, a.y / s);
export const conj = (a: Complex) => complex(a.x, -a.y);
export const inv = (a: Complex) => scale(conj(a), 1 / abs2(a));
export const eq = (a: Complex, b: Complex) => a.x === b.x && a.y === b.y;

export const normalize = (a: Complex) => scaleInv(a, abs(a));

export const re = (a: Complex) => a.x;
export const im = (a: Complex) => a.y;
export const arg = (a: Complex) => Math.atan2(a.y, a.x);

export const add = (a: Complex, b: Complex) => complex(a.x + b.x, a.y + b.y);
export const sub = (a: Complex, b: Complex) => complex(a.x - b.x, a.y - b.y);

export const mul = (a: Complex, b: Complex) =>
  complex(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
export const div = (a: Complex, b: Complex) => mul(a, inv(b));

export const exp = (a: Complex) => polar(Math.exp(a.x), a.y);
export const log = (a: Complex) => complex(Math.log(abs(a)), arg(a));
export const cosh = (a: Complex) => scale(add(exp(a), exp(neg(a))), 1 / 2);
export const sinh = (a: Complex) => scale(sub(exp(a), exp(neg(a))), 1 / 2);
export const cos = (a: Complex) => cosh(mul(i, a));
export const sin = (a: Complex) => mul(neg(i), sinh(mul(i, a)));

export const pow = (a: Complex, b: Complex) => exp(mul(log(a), b));
