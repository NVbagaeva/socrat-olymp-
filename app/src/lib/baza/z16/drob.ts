/**
 * База, задание №16: точные дроби для разборов.
 *
 * В условиях встречаются 34^{12} и 10^{-6} — в обычных числах такие
 * значения теряют точность. Разбор считает в обыкновенных дробях на
 * BigInt, а в запись бланка переводит делением в столбик.
 */

import { tex } from '../chisla';

export interface Q {
  readonly n: bigint;
  readonly d: bigint;
}

const B0 = BigInt(0);
const B1 = BigInt(1);
const B2 = BigInt(2);
const B5 = BigInt(5);
const B10 = BigInt(10);

function nodB(a: bigint, b: bigint): bigint {
  let x = a < B0 ? -a : a;
  let y = b < B0 ? -b : b;
  while (y !== B0) [x, y] = [y, x % y];
  return x;
}

export function q(n: number | bigint, d: number | bigint = 1): Q {
  let a = BigInt(n);
  let b = BigInt(d);
  if (b === B0) throw new Error('деление на ноль');
  if (b < B0) [a, b] = [-a, -b];
  const g = nodB(a, b);
  return g === B0 ? { n: B0, d: B1 } : { n: a / g, d: b / g };
}

export const add = (x: Q, y: Q): Q => q(x.n * y.d + y.n * x.d, x.d * y.d);
export const sub = (x: Q, y: Q): Q => q(x.n * y.d - y.n * x.d, x.d * y.d);
export const mul = (x: Q, y: Q): Q => q(x.n * y.n, x.d * y.d);
export const div = (x: Q, y: Q): Q => q(x.n * y.d, x.d * y.n);
export const neg = (x: Q): Q => q(-x.n, x.d);
export const eqQ = (x: Q, y: Q): boolean => x.n === y.n && x.d === y.d;
export const tseloe = (x: Q): boolean => x.d === B1;

/** Целая степень дроби, показатель любого знака. */
export function powQ(x: Q, e: number): Q {
  if (e < 0) return powQ(div(q(1), x), -e);
  let r = q(1);
  for (let i = 0; i < e; i += 1) r = mul(r, x);
  return r;
}

/** «1,6» → 8/5. */
export function dec(s: string): Q {
  const t = s.replace('−', '-');
  const minus = t.startsWith('-');
  const [ts = '0', dr = ''] = t.replace('-', '').split(',');
  const v = q(BigInt(ts + dr), B10 ** BigInt(dr.length));
  return minus ? neg(v) : v;
}

function sqrtB(n: bigint): bigint | null {
  if (n < B0) return null;
  if (n < B2) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x -= B1;
  while ((x + B1) * (x + B1) <= n) x += B1;
  return x * x === n ? x : null;
}

/** Точный квадратный корень дроби или null. */
export function sqrtQ(x: Q): Q | null {
  const a = sqrtB(x.n);
  const b = sqrtB(x.d);
  return a === null || b === null ? null : q(a, b);
}

/** Конечна ли десятичная запись. */
export function konechnaQ(x: Q): boolean {
  let d = x.d;
  while (d % B2 === B0) d /= B2;
  while (d % B5 === B0) d /= B5;
  return d === B1;
}

/** Запись бланка: «−0,125», «1000101». Бросает на бесконечной дроби. */
export function zapisQ(x: Q): string {
  if (!konechnaQ(x)) throw new Error(`бесконечная дробь ${x.n}/${x.d}`);
  const minus = x.n < B0;
  let ch = minus ? -x.n : x.n;
  const tse = ch / x.d;
  ch %= x.d;
  let drob = '';
  while (ch !== B0) {
    ch *= B10;
    drob += String(ch / x.d);
    ch %= x.d;
  }
  return `${minus ? '−' : ''}${String(tse)}${drob === '' ? '' : `,${drob}`}`;
}

/** Значение в TeX: конечная дробь — десятичной, иначе \dfrac. */
export function texQ(x: Q): string {
  if (konechnaQ(x)) return tex(zapisQ(x));
  const minus = x.n < B0;
  return `${minus ? '-' : ''}\\dfrac{${String(minus ? -x.n : x.n)}}{${String(x.d)}}`;
}

/** Значение в TeX обыкновенной дробью: \dfrac{3}{4}, целое — числом. */
export function texDrobQ(x: Q): string {
  if (tseloe(x)) return String(x.n);
  const minus = x.n < B0;
  return `${minus ? '-' : ''}\\dfrac{${String(minus ? -x.n : x.n)}}{${String(x.d)}}`;
}

export const chislo = (x: Q): number => Number(x.n) / Number(x.d);
