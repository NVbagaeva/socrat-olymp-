/**
 * Короткие конструкторы элементов кадра: сцены схем читаются как
 * список построений, а не как простыня объектов.
 */

import type { Cvet, Element, StilLinii, T2 } from './tipy';

type Opcii = Partial<{
  gruppy: readonly string[];
  shag: number;
  skrytyy: boolean;
  cvet: Cvet | Readonly<Record<string, Cvet>>;
}>;

export const otr = (
  id: string,
  a: T2,
  b: T2,
  o: Opcii & { stil?: StilLinii; shtrihi?: 1 | 2 | 3 } = {},
): Element => ({ vid: 'otrezok', id, a, b, ...o });

export const okr = (
  id: string,
  c: T2,
  r: number,
  o: Opcii & { stil?: StilLinii } = {},
): Element => ({
  vid: 'okruzhnost',
  id,
  c,
  r,
  ...o,
});

/** Заливка многоугольника: по умолчанию видна только при подсветке. */
export const mnog = (id: string, tochki: readonly T2[], o: Opcii = {}): Element => ({
  vid: 'mnogougolnik',
  id,
  tochki,
  skrytyy: true,
  ...o,
});

export const ug = (
  id: string,
  a: T2,
  v: T2,
  b: T2,
  o: Opcii & { dugi?: 1 | 2 | 3; pryamoy?: boolean } = {},
): Element => ({ vid: 'ugol', id, a, v, b, ...o });

export const tch = (imya: string, p: T2, o: Opcii = {}): Element => ({
  vid: 'tochka',
  id: `t-${imya}`,
  p,
  imya,
  ...o,
});
