/**
 * Координатная прямая к задаче на геометрическую вероятность.
 *
 * Величина равномерно распределена на отрезке [a; b], благоприятный
 * промежуток — от c до d. Здесь описано только то, что нужно
 * нарисовать; сам рисунок собирает компонент CoordinateLine через
 * Vizualizatsiya (см. bank4/vizual.ts, otrezok),
 * а числа для подписей считаются тут же, чтобы у рисунка и у разбора
 * был один источник.
 *
 * Любая из границ c и d может отсутствовать: «x > c» без верхней
 * границы или «x < d» без нижней. Тогда промежуток упирается в край
 * отрезка распределения, и длина считается до этого края.
 */

import { dec } from './types';

export interface Pryamaya {
  /** Левый конец отрезка распределения. */
  a: number;
  /** Правый конец отрезка распределения. */
  b: number;
  /** Нижняя граница благоприятного промежутка; нет — промежуток от a. */
  c?: number;
  /** Верхняя граница благоприятного промежутка; нет — промежуток до b. */
  d?: number;
  /**
   * Нестрогие неравенства (≥ и ≤): точки c и d закрашены. По
   * умолчанию неравенства строгие и кружки пустые. Для геометрической
   * вероятности на ответ это не влияет, но на рисунке отличие есть.
   */
  nestrogo?: boolean;
  /** Имя переменной на оси и в подписях; по умолчанию x. */
  peremennaya?: string;
  /**
   * Подписи чисел на оси, если запись отличается от самого числа:
   * «0,5» вместо 0.5 рисуется и без этого, а вот «10:00» — нет.
   */
  podpisi?: Partial<Record<'a' | 'b' | 'c' | 'd', string>>;
  /**
   * Подпись длины благоприятного промежутка. По умолчанию
   * «l = d − c»; null — не показывать.
   */
  dlina?: string | null;
}

/** Границы промежутка после подстановки краёв отрезка. */
export interface Promezhutok {
  ot: number;
  do: number;
}

export function promezhutok(p: Pryamaya): Promezhutok {
  if (p.c === undefined && p.d === undefined) {
    throw new Error('У координатной прямой нет ни одной границы промежутка');
  }
  const ot = p.c ?? p.a;
  const do_ = p.d ?? p.b;
  if (!(p.a < p.b) || ot < p.a || do_ > p.b || !(ot < do_)) {
    throw new Error(`Промежуток [${ot}; ${do_}] не лежит в отрезке [${p.a}; ${p.b}]`);
  }
  return { ot, do: do_ };
}

/** Подпись числа на оси: своя, если задана, иначе число по-русски. */
export function podpis(p: Pryamaya, kluch: 'a' | 'b' | 'c' | 'd'): string {
  const svoya = p.podpisi?.[kluch];
  if (svoya !== undefined) {
    return svoya;
  }
  const value = p[kluch];
  return value === undefined ? '' : dec(value);
}

/** Подпись условия над линией: «x > 700» или «x ≥ 700». */
export function usloviePodpis(p: Pryamaya, storona: 'c' | 'd'): string {
  const x = p.peremennaya ?? 'x';
  const znak = storona === 'c' ? (p.nestrogo ? '≥' : '>') : p.nestrogo ? '≤' : '<';
  return `${x} ${znak} ${podpis(p, storona)}`;
}

/** Подпись длины: «l = 200», если не задана своя. */
export function dlinaPodpis(p: Pryamaya): string | null {
  if (p.dlina === null) {
    return null;
  }
  if (p.dlina !== undefined) {
    return p.dlina;
  }
  const { ot, do: do_ } = promezhutok(p);
  return `l = ${dec(do_ - ot)}`;
}
