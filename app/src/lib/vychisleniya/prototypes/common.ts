/**
 * Общие кирпичи генераторов задания №8.
 */

import type { Rng } from '../rng';
import type { Draft, Level, Params, Podtip } from '../types';

/** Подтип: идентификатор, уровень, генератор. */
export function podtip(id: string, level: Level, generate: (r: Rng) => Draft | null): Podtip {
  return { id, level, generate };
}

/** Условие «Найдите значение выражения …». */
export function naydi(tex: string): string {
  return `Найдите значение выражения $${tex}$.`;
}

/** Условие с подстановкой: «… при a = 1,5, b = −2». */
export function naydiPri(tex: string, pri: string): string {
  return `Найдите значение выражения $${tex}$ при $${pri}$.`;
}

/** Ключ параметров: по нему узнаётся повтор и исключение. */
export function paramsKey(params: Params): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join(';');
}

/** Ключи исключений из списка параметров. */
export function keys(list: Params[]): string[] {
  return list.map(paramsKey);
}

/** Не полный квадрат из отрезка. */
export function nonSquare(r: Rng, a: number, b: number): number {
  for (let i = 0; i < 50; i += 1) {
    const n = r.int(a, b);
    const s = Math.round(Math.sqrt(n));
    if (s * s !== n) {
      return n;
    }
  }
  return 2;
}

/** Десятичное число с одним знаком, нецелое, из отрезка. */
export function tenth(r: Rng, a: number, b: number): number {
  for (let i = 0; i < 50; i += 1) {
    const x = r.dec(a, b, 1);
    if (!Number.isInteger(x)) {
      return x;
    }
  }
  return a + 0.1;
}

/** Множитель первой попавшейся пары простых. */
export const PRIME_PAIRS: [number, number][] = [
  [2, 3],
  [2, 5],
  [2, 7],
  [3, 5],
  [3, 7],
  [2, 11],
  [5, 7],
  [3, 11],
  [2, 13],
];
