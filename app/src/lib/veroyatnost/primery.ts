/**
 * Разобранные примеры из референса задания №4 — параметры рисунков.
 *
 * Два примера раздела 05 референса, у которых в базе пока нет задач
 * своего вида: хлеб на отрезке [600; 1000] (координатная прямая,
 * случай отрезка) и два пирожка (дерево вероятностей). Числа взяты из
 * референса один в один; здесь они лежат один раз, а рисуются теми же
 * компонентами, что и задачи, — во вкладке «Ключевые методы» и на
 * печатном листе.
 */

import type { ParametryDereva, ParametryPryamoy, Vizual } from './model';

/** Масса хлеба равномерно распределена на [600; 1000], ищем 700 < x < 900. */
export const HLEB: Extract<ParametryPryamoy, { shape: 'segment' }> = {
  method: 'coordinate-line',
  shape: 'segment',
  min: 600,
  max: 1000,
  c: 700,
  d: 900,
  leftBoundary: 'strict',
  rightBoundary: 'strict',
};

/** Два пирожка, каждый с мясом с вероятностью 0,8. */
export const PIROZHKI_VETVI: ParametryDereva['branches'] = [
  { id: 'a', parent: null, label: 'с мясом', p: 0.8 },
  { id: 'b', parent: null, label: 'без мяса', p: 0.2 },
  { id: 'aa', parent: 'a', label: 'с мясом', p: 0.8 },
  { id: 'ab', parent: 'a', label: 'без мяса', p: 0.2 },
  { id: 'ba', parent: 'b', label: 'с мясом', p: 0.8 },
  { id: 'bb', parent: 'b', label: 'без мяса', p: 0.2 },
];

export const PIROZHKI_UROVNI: readonly string[] = ['1-й пирожок', '2-й пирожок'];

/** Рисунок примера с хлебом: у прямой подсветки нет, мера видна по границам. */
export const HLEB_VIZUAL: Vizual = {
  parametry: HLEB,
  podsvetka: { method: 'coordinate-line' },
};

/**
 * Рисунок примера с пирожками. «Хотя бы один с мясом» — три пути из
 * четырёх: все, кроме «без мяса, без мяса».
 */
export const PIROZHKI_VIZUAL: Vizual = {
  parametry: { method: 'probability-tree', levels: [...PIROZHKI_UROVNI], branches: PIROZHKI_VETVI },
  podsvetka: { method: 'probability-tree', highlightedPaths: ['aa', 'ab', 'ba'] },
};
