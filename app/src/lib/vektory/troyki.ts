/**
 * Целочисленные векторы с целой длиной — пифагоровы тройки.
 *
 * Длина вектора в задании всегда целая или конечная десятичная дробь,
 * поэтому результирующий вектор подбирается из этого списка, а не
 * проверяется после. Список строится один раз на границу: все
 * (x; y) с ненулевыми координатами, |x|, |y| ≤ bound и целой
 * длиной, во всех четвертях.
 */

import { isSquare } from '../vychisleniya/numbers';
import type { Tochka } from './types';

const cache = new Map<number, Tochka[]>();

/** Все векторы с целой длиной и |x|, |y| ≤ bound, обе координаты ≠ 0. */
export function pifagorovy(bound: number): Tochka[] {
  const got = cache.get(bound);
  if (got !== undefined) {
    return got;
  }
  const out: Tochka[] = [];
  for (let x = 1; x <= bound; x += 1) {
    for (let y = 1; y <= bound; y += 1) {
      if (isSquare(x * x + y * y)) {
        out.push([x, y], [-x, y], [x, -y], [-x, -y]);
      }
    }
  }
  cache.set(bound, out);
  return out;
}

/** Целая длина вектора или null. */
export function tselayaDlina(p: Tochka): number | null {
  const q = p[0] * p[0] + p[1] * p[1];
  return isSquare(q) ? Math.round(Math.sqrt(q)) : null;
}

export function dlina(p: Tochka): number {
  return Math.hypot(p[0], p[1]);
}

export function skalyar(a: Tochka, b: Tochka): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function plus(a: Tochka, b: Tochka): Tochka {
  return [a[0] + b[0], a[1] + b[1]];
}

export function umnozh(k: number, a: Tochka): Tochka {
  return [k * a[0], k * a[1]];
}

/** Линейная комбинация с целыми коэффициентами. */
export function komb(terms: readonly (readonly [number, Tochka])[]): Tochka {
  let x = 0;
  let y = 0;
  for (const [k, p] of terms) {
    x += k * p[0];
    y += k * p[1];
  }
  return [x, y];
}

/** Косой вектор: обе координаты ненулевые. */
export function kosoy(p: Tochka): boolean {
  return p[0] !== 0 && p[1] !== 0;
}
