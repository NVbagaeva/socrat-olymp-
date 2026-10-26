/** Короткие конструкторы элементов для сцен справочника теорем. */

import type { Element, T2 } from '@/lib/planimetriya/types';

export const otr = (a: string, b: string, o: Partial<Element> = {}): Element =>
  ({ tip: 'otrezok', a, b, ...o }) as Element;
export const pun = (a: string, b: string): Element => otr(a, b, { stil: 'punktir' });
export const mn = (...tochki: string[]): Element => ({ tip: 'mnogougolnik', tochki });
export const tch = (t: string): Element => ({ tip: 'tochka', t });
export const pr = (a: string, v: string, b: string): Element => ({
  tip: 'ugol',
  a,
  v,
  b,
  pryamoy: true,
});
export const ug = (a: string, v: string, b: string, dugi: 1 | 2 = 1): Element => ({
  tip: 'ugol',
  a,
  v,
  b,
  dugi,
});
export const sh = (a: string, b: string, n: 1 | 2): Element =>
  ({ tip: 'otrezok', a, b, shtrihi: n, tolkoShtrihi: true }) as Element;

/** Плоскость параллелограммом: углы P1…P4, без подписей. */
export const PLOSKOST: Record<string, T2> = { P1: [0, 0], P2: [7, 0], P3: [9, 3], P4: [2, 3] };
export const BEZ = ['P1', 'P2', 'P3', 'P4'];
/** Подпись прямой или плоскости буквой у отрезка (линия уже нарисована). */
export const im = (a: string, b: string, znachenie: string): Element =>
  ({ tip: 'otrezok', a, b, tolkoShtrihi: true, vydelit: 'dano', znachenie }) as Element;
export const ALFA = im('P1', 'P2', 'α');
