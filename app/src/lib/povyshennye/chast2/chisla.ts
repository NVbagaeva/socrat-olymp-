/**
 * Точные числа для шаблонов части 2 вариантов 3–4: степени с дробным
 * показателем, числа вида u + k√m (корни квадратных уравнений) и их
 * сравнение с концами отрезка, многочлены в показателе.
 */

import {
  add,
  cmp,
  div,
  mul,
  rat,
  ratTex,
  sign,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { sqrtRat } from '@/lib/zadanie15/core/surd';
import { dec } from './tex';

/** Целый корень степени d из натурального n или null. */
function koren(n: bigint, d: bigint): bigint | null {
  if (n < 0n) return null;
  let lo = 0n;
  let hi = n + 1n;
  while (hi - lo > 1n) {
    const m = (lo + hi) / 2n;
    if (m ** d <= n) lo = m;
    else hi = m;
  }
  return lo ** d === n ? lo : null;
}

/** b^e для натурального b и дроби e — точно; ошибка, если результат не дробь. */
export function stepen(b: number, e: Rat): Rat {
  const r = koren(BigInt(b), e.d);
  if (r === null) throw new Error(`stepen: ${b}^${e.n}/${e.d} не рационально`);
  const n = e.n < 0n ? -e.n : e.n;
  const v = r ** n;
  return e.n < 0n ? rat(1n, v) : rat(v);
}

/** Показатель: log_b(y) для y = b^e — e как дробь (перебор знаменателей до 12). */
export function logRat(b: number, y: Rat): Rat {
  for (let d = 1; d <= 12; d += 1)
    for (let n = -60; n <= 60; n += 1) {
      const e = rat(n, d);
      try {
        if (cmp(stepen(b, e), y) === 0) return e;
      } catch {
        /* не дробь — дальше */
      }
    }
  throw new Error(`logRat: ${y.n}/${y.d} не степень ${b}`);
}

/** Число u + k√m (m ≥ 1 без квадратов; k = 0 — рациональное). */
export interface SKornem {
  u: Rat;
  k: Rat;
  m: bigint;
}

export const skToNumber = (x: SKornem): number =>
  toNumber(x.u) + toNumber(x.k) * Math.sqrt(Number(x.m));

/** u ± √D: корень приведён к виду k√m. */
export function sKornem(u: Rat, D: Rat, znak: 1 | -1): SKornem {
  const s = sqrtRat(D);
  const k = znak === 1 ? s.k : mul(s.k, rat(-1));
  return s.m === 1n ? { u: add(u, k), k: rat(0), m: 1n } : { u, k, m: s.m };
}

/** TeX: «\dfrac{3-\sqrt{5}}{2}», «-\dfrac{18+4\sqrt{69}}{65}», «-2{,}5» как дробь. */
export function skTex(x: SKornem): string {
  if (x.k.n === 0n || x.m === 1n) return ratTex(add(x.u, mul(x.k, rat(x.m === 1n ? 1 : 0))));
  const L = lcm(x.u.d, x.k.d);
  let U = (x.u.n * L) / x.u.d;
  let K = (x.k.n * L) / x.k.d;
  let minus = '';
  /* Оба отрицательны (или u = 0, k < 0) — минус выносим за дробь. */
  if (L > 1n && U <= 0n && K < 0n) {
    U = -U;
    K = -K;
    minus = '-';
  }
  const kor = `${K < 0n ? -K : K}`.replace(/^1$/, '') + `\\sqrt{${x.m}}`;
  const chisl = U === 0n ? `${K < 0n ? '-' : ''}${kor}` : `${U}${K < 0n ? '-' : '+'}${kor}`;
  if (L === 1n) return chisl;
  return `${minus}\\dfrac{${chisl}}{${L}}`;
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
const lcm = (a: bigint, b: bigint) => (a / gcd(a, b)) * b;

/** Десятичная запись дроби для TeX (конец отрезка 0,4 или 1,4). */
export function ratDecTexStrict(c: Rat): string {
  return dec(toNumber(c));
}

/**
 * Сравнение x = u + k√m с дробью c: знак и объяснение одной строкой
 * TeX — сводим к сравнению √m с числом и возводим в квадрат.
 */
export function sravnit(x: SKornem, c: Rat): { znak: -1 | 0 | 1; pochemu: string | null } {
  if (x.k.n === 0n || x.m === 1n) {
    const v = add(x.u, x.m === 1n ? x.k : rat(0));
    return { znak: sign(sub(v, c)), pochemu: null };
  }
  /* x − c = (u − c) + k√m; знак k√m против c − u. */
  const v = div(sub(c, x.u), x.k);
  const kPol = sign(x.k) > 0;
  /* x > c ⇔ √m > v (k > 0) или √m < v (k < 0). */
  const vTex = dec(toNumber(v));
  let koren: -1 | 1;
  let pochemu: string;
  if (sign(v) <= 0) {
    koren = 1;
    pochemu = `$\\sqrt{${x.m}}>0${sign(v) < 0 ? `>${vTex}` : ''}$`;
  } else {
    const v2 = mul(v, v);
    koren = cmp(rat(x.m), v2) > 0 ? 1 : -1;
    pochemu = `$\\sqrt{${x.m}}${koren > 0 ? '>' : '<'}${vTex}$, так как $${x.m}${koren > 0 ? '>' : '<'}${dec(toNumber(v2))}$`;
  }
  const znak = (kPol ? koren : -koren) as -1 | 1;
  return { znak, pochemu };
}

/**
 * Многочлен в показателе: [[коэф, степень], …] → «x^3-x^2+3x-0{,}5».
 * Коэффициенты — дроби, свободный член пишется десятичной дробью.
 */
export function mnogochlen(chleny: readonly (readonly [Rat, number])[]): string {
  let s = '';
  for (const [c, st] of chleny) {
    if (c.n === 0n) continue;
    const neg = c.n < 0n;
    const a = neg ? rat(-c.n, c.d) : c;
    const ed = a.n === 1n && a.d === 1n && st > 0;
    const chislo = ed ? '' : a.d === 1n ? `${a.n}` : dec(toNumber(a));
    const bukva = st === 0 ? '' : st === 1 ? 'x' : `x^${st}`;
    s += `${neg ? '-' : s === '' ? '' : '+'}${chislo}${bukva}`;
  }
  return s === '' ? '0' : s;
}

/** Конечная десятичная дробь — точно («15{,}12», «1{,}7578125»), иначе обыкновенная. */
export function tochnoTex(x: Rat): string {
  let d = x.d;
  let a = 0;
  let b = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    a += 1;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    b += 1;
  }
  const z = Math.max(a, b);
  return d === 1n && z <= 8 ? dec(toNumber(x), z) : ratTex(x);
}
