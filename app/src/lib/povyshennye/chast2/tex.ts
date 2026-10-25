/**
 * Запись чисел в шаблонах части 2: дроби, корни, кратные π, десятичная
 * запятая. Точная арифметика — дроби и корни ядра №15
 * (lib/zadanie15/core): длины и ответы не считаются во float.
 */

import { rat, ratTex, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, type Surd } from '@/lib/zadanie15/core/surd';

export { rat, ratTex, sqrtRat, surdTex };
export type { Rat, Surd };

/** Десятичная запись с запятой: 14.4 → «14{,}4» (TeX), без лишних нулей. */
export function dec(x: number, znakov = 6): string {
  const s = String(Math.round(x * 10 ** znakov) / 10 ** znakov);
  return s.replace('.', '{,}');
}

/** То же для текста вне формулы: «14,4». */
export function decText(x: number, znakov = 6): string {
  return String(Math.round(x * 10 ** znakov) / 10 ** znakov).replace('.', ',');
}

/**
 * Дробь TeX, а если знаменатель 2, 4, 5, 8, 10 — по желанию десятичной:
 * «−4,5» вместо −9/2 в ответе к №19, как в бланке.
 */
export function ratDecTex(a: Rat): string {
  let d = a.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  if (d !== 1n) return ratTex(a);
  return dec(Number(a.n) / Number(a.d));
}

/** √(дробь) в TeX: «\dfrac{3}{2}», «2\sqrt{2}». */
export function korenTex(kvadrat: Rat): string {
  return surdTex(sqrtRat(kvadrat));
}

/** Кратное π: q = −11/2 → «-\dfrac{11\pi}{2}», 1 → «\pi», 0 → «0». */
export function piTex(q: Rat): string {
  if (q.n === 0n) return '0';
  const neg = q.n < 0n;
  const n = neg ? -q.n : q.n;
  const s = neg ? '-' : '';
  const num = n === 1n ? '\\pi' : `${n}\\pi`;
  return q.d === 1n ? `${s}${num}` : `${s}\\dfrac{${num}}{${q.d}}`;
}

/** Серия «x₀ + 2πn» в TeX: «\dfrac{\pi}{2}+2\pi n», «-\pi+2\pi n», «2\pi n». */
export function seriyaTex(x0: Rat, bukva = 'n'): string {
  if (x0.n === 0n) return `2\\pi ${bukva}`;
  return `${piTex(x0)}+2\\pi ${bukva}`;
}

/** Склонение: 1 балл, 2 балла, 5 баллов. */
export function sklon(n: number, odin: string, dva: string, pyat: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return pyat;
  if (b === 1) return odin;
  if (b >= 2 && b <= 4) return dva;
  return pyat;
}

/** Число с минусом-тире в TeX уже верное; в тексте — «−». */
export function minus(s: string): string {
  return s.replace(/-/g, '−');
}
