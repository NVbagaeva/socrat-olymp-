/**
 * Числа с корнями: k√m, где k — дробь, m — натуральное без квадратов,
 * и суммы таких слагаемых (периметр сечения: 2√5 + 3√2).
 *
 * Длины и площади в ядре никогда не хранятся как float: квадрат длины
 * рационален, длина — корень из дроби, а √(p/q) = √(pq)/q сводится
 * к виду k√m. Сумма приводит подобные (одинаковые m).
 */

import { type Rat, ONE, ZERO, add, eq, isZero, mul, rat, ratTex, sign, toNumber } from './rational';

/** k·√m, m ≥ 1 без квадратных множителей. */
export interface Surd {
  readonly k: Rat;
  readonly m: bigint;
}

/** Сумма слагаемых k·√m с разными m, отсортированных по m. */
export interface SurdSum {
  readonly terms: readonly Surd[];
}

/** Выносим квадраты из-под корня: m = s²·r. */
function splitSquares(m: bigint): { s: bigint; r: bigint } {
  let s = 1n;
  let r = m;
  for (let p = 2n; p * p <= r; p += 1n) {
    while (r % (p * p) === 0n) {
      r /= p * p;
      s *= p;
    }
  }
  return { s, r };
}

/** √x для дроби x ≥ 0: √(p/q) = √(pq)/q. */
export function sqrtRat(x: Rat): Surd {
  const s = sign(x);
  if (s < 0) throw new Error('sqrtRat: корень из отрицательного числа');
  if (s === 0) return { k: ZERO, m: 1n };
  const { s: out, r } = splitSquares(x.n * x.d);
  return { k: rat(out, x.d), m: r };
}

export const surdOf = (k: Rat, m: bigint = 1n): Surd => {
  if (m === 1n || isZero(k)) return { k, m: 1n };
  const { s, r } = splitSquares(m);
  return { k: mul(k, rat(s)), m: r };
};

export const surdMul = (a: Surd, b: Surd): Surd => {
  const { s, r } = splitSquares(a.m * b.m);
  return { k: mul(mul(a.k, b.k), rat(s)), m: r };
};

export const surdScale = (a: Surd, c: Rat): Surd => ({ k: mul(a.k, c), m: a.m });

export const surdEq = (a: Surd, b: Surd): boolean =>
  (isZero(a.k) && isZero(b.k)) || (eq(a.k, b.k) && a.m === b.m);

export const surdToNumber = (a: Surd): number => toNumber(a.k) * Math.sqrt(Number(a.m));

/** Квадрат числа k√m — дробь k²m. */
export const surdSquare = (a: Surd): Rat => mul(mul(a.k, a.k), rat(a.m));

/** Сумма корней с приведением подобных. */
export function surdSum(items: readonly Surd[]): SurdSum {
  const by = new Map<bigint, Rat>();
  for (const it of items) {
    if (isZero(it.k)) continue;
    by.set(it.m, add(by.get(it.m) ?? ZERO, it.k));
  }
  const terms = [...by.entries()]
    .filter(([, k]) => !isZero(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([m, k]) => ({ k, m }));
  return { terms };
}

export const sumToNumber = (s: SurdSum): number =>
  s.terms.reduce((acc, t) => acc + surdToNumber(t), 0);

export function sumEq(a: SurdSum, b: SurdSum): boolean {
  if (a.terms.length !== b.terms.length) return false;
  return a.terms.every((t, i) => {
    const u = b.terms[i];
    return u !== undefined && surdEq(t, u);
  });
}

/** TeX одного слагаемого: 3\sqrt{2}, \dfrac{\sqrt{6}}{2}, 5. */
export function surdTex(a: Surd): string {
  if (isZero(a.k)) return '0';
  if (a.m === 1n) return ratTex(a.k);
  const root = `\\sqrt{${a.m}}`;
  const neg = a.k.n < 0n;
  const n = neg ? -a.k.n : a.k.n;
  const s = neg ? '-' : '';
  const num = n === 1n ? root : `${n}${root}`;
  return a.k.d === 1n ? `${s}${num}` : `${s}\\dfrac{${num}}{${a.k.d}}`;
}

export function sumTex(s: SurdSum): string {
  if (s.terms.length === 0) return '0';
  return s.terms
    .map((t, i) => {
      const tex = surdTex(t);
      return i > 0 && !tex.startsWith('-') ? `+${tex}` : tex;
    })
    .join('');
}

/** Короткая запись для тестов: «3√2», «5/2√3», «4». */
export function surdStr(a: Surd): string {
  if (isZero(a.k)) return '0';
  const k = a.k.d === 1n ? `${a.k.n}` : `${a.k.n}/${a.k.d}`;
  if (a.m === 1n) return k;
  return `${eq(a.k, ONE) ? '' : k}√${a.m}`;
}

export const sumStr = (s: SurdSum): string =>
  s.terms.length === 0 ? '0' : s.terms.map(surdStr).join(' + ');
