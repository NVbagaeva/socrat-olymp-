/**
 * База №17: точные дроби на BigInt.
 *
 * Корни уравнений — конечные десятичные дроби, а при подстановке в
 * показательные уравнения появляются степени вроде 125^{24}: считать
 * их в плавающей точке нельзя. Дробь — пара целых BigInt, всегда
 * несократимая, знаменатель положительный.
 */

import { konechna, tex, zapis } from '../chisla';

export interface Q {
  readonly n: bigint;
  readonly d: bigint;
}

function nodB(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function q(n: bigint | number, d: bigint | number = 1n): Q {
  let ch = BigInt(n);
  let zn = BigInt(d);
  if (zn === 0n) throw new Error('деление на ноль');
  if (zn < 0n) {
    ch = -ch;
    zn = -zn;
  }
  const g = nodB(ch, zn);
  return g === 0n ? { n: 0n, d: 1n } : { n: ch / g, d: zn / g };
}

export const NOL = q(0);
export const ODIN = q(1);

export const plus = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const minus = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const umn = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const del = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
export const prot = (a: Q): Q => q(-a.n, a.d);
export const ravny = (a: Q, b: Q): boolean => a.n === b.n && a.d === b.d;
export const znak = (a: Q): number => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
export const tseloe = (a: Q): boolean => a.d === 1n;
export const nol = (a: Q): boolean => a.n === 0n;
export const abs = (a: Q): Q => (a.n < 0n ? prot(a) : a);
export const sravnit = (a: Q, b: Q): number => znak(minus(a, b));

/** a в целой степени k (k может быть отрицательным). */
export function step(a: Q, k: number): Q {
  if (!Number.isInteger(k)) throw new Error('нецелая степень');
  if (k < 0) return step(del(ODIN, a), -k);
  return q(a.n ** BigInt(k), a.d ** BigInt(k));
}

export const chislo = (a: Q): number => Number(a.n) / Number(a.d);

/** Конечная ли десятичная запись. */
export const desyatichnaya = (a: Q): boolean => konechna(Number(a.n), Number(a.d));

/** Запись бланка: «−3,75». */
export function zapisQ(a: Q): string {
  return zapis(Number(a.n), Number(a.d));
}

/**
 * Число в TeX: целое — как есть, конечная дробь — десятичной записью
 * «0{,}25», остальные — обыкновенной дробью.
 */
export function texQ(a: Q): string {
  if (tseloe(a)) return a.n.toString();
  if (desyatichnaya(a) && zapisQ(a).length <= 7) return tex(zapisQ(a));
  const s = a.n < 0n ? '-' : '';
  return `${s}\\frac{${(a.n < 0n ? -a.n : a.n).toString()}}{${a.d.toString()}}`;
}

/** Число в скобках, если оно отрицательное: для подстановки и умножения. */
export function texQs(a: Q): string {
  return znak(a) < 0 ? `(${texQ(a)})` : texQ(a);
}
