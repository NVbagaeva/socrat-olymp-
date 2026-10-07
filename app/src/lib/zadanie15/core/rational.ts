/**
 * Точные рациональные числа на BigInt.
 *
 * Ядро сечений не сравнивает float «на глаз»: координаты точек,
 * параметры на рёбрах, коэффициенты плоскостей — дроби. Дробь всегда
 * несократима, знаменатель положителен, поэтому равенство — это
 * равенство числителей и знаменателей.
 */

export interface Rat {
  readonly n: bigint;
  readonly d: bigint;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Дробь n/d, сокращённая, со знаменателем больше нуля. */
export function rat(n: bigint | number, d: bigint | number = 1n): Rat {
  let nn = typeof n === 'bigint' ? n : toBig(n);
  let dd = typeof d === 'bigint' ? d : toBig(d);
  if (dd === 0n) {
    throw new Error('rat: деление на ноль');
  }
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd);
  return g > 1n ? { n: nn / g, d: dd / g } : { n: nn, d: dd };
}

function toBig(x: number): bigint {
  if (!Number.isInteger(x)) {
    throw new Error(`rat: ${x} — не целое; дробь задаётся как rat(n, d)`);
  }
  return BigInt(x);
}

/**
 * Дробь из десятичной записи: 2.5 → 5/2. Только для конечных
 * десятичных дробей, заданных человеком (параметры фигуры).
 */
export function ratDec(x: number): Rat {
  if (Number.isInteger(x)) return rat(x);
  const s = String(x);
  if (/e/i.test(s)) throw new Error(`ratDec: ${x} — экспоненциальная запись`);
  const [int = '0', frac = ''] = s.replace('-', '').split('.');
  const sign = x < 0 ? -1n : 1n;
  const den = 10n ** BigInt(frac.length);
  return rat(sign * (BigInt(int) * den + BigInt(frac || '0')), den);
}

export const ZERO = rat(0);
export const ONE = rat(1);

export const add = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
export function div(a: Rat, b: Rat): Rat {
  if (b.n === 0n) throw new Error('div: деление на ноль');
  return rat(a.n * b.d, a.d * b.n);
}
export const neg = (a: Rat): Rat => ({ n: -a.n, d: a.d });
export const abs = (a: Rat): Rat => (a.n < 0n ? neg(a) : a);

export const isZero = (a: Rat): boolean => a.n === 0n;
export const eq = (a: Rat, b: Rat): boolean => a.n === b.n && a.d === b.d;
/** Знак: −1, 0 или 1. */
export const sign = (a: Rat): -1 | 0 | 1 => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0);
export const cmp = (a: Rat, b: Rat): -1 | 0 | 1 => sign(sub(a, b));
export const lt = (a: Rat, b: Rat): boolean => cmp(a, b) < 0;
export const le = (a: Rat, b: Rat): boolean => cmp(a, b) <= 0;

/** Приближённое значение — только для рисования, не для решений. */
export const toNumber = (a: Rat): number => Number(a.n) / Number(a.d);

export const isInt = (a: Rat): boolean => a.d === 1n;

/** «3», «-5/2». */
export const ratStr = (a: Rat): string => (a.d === 1n ? `${a.n}` : `${a.n}/${a.d}`);

/** TeX: 3, -\dfrac{5}{2}. */
export function ratTex(a: Rat): string {
  if (a.d === 1n) return `${a.n}`;
  const s = a.n < 0n ? '-' : '';
  const n = a.n < 0n ? -a.n : a.n;
  return `${s}\\dfrac{${n}}{${a.d}}`;
}
