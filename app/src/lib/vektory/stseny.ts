/**
 * Рисунки для вкладок «Теория» и «О задании» задания №2.
 *
 * Здесь только данные: векторы, окно, режим. Рисует их движок
 * render.ts — своих SVG в разделе нет. Числа подобраны так, чтобы
 * каждый рисунок показывал ровно то, о чём рядом идёт речь: вектор
 * (4; 3) с катетами, пример со знаком из теории, сумма по правилу
 * треугольника, длина 5, перпендикулярная пара.
 *
 * Векторы с общим началом (сумма, угол) нарушают ограничения
 * генератора задач — для рисунков теории это не ограничение: движок
 * рисует их и лишь отмечает это в отчёте.
 */

import type { Risunok } from './types';

export type StsenaId =
  | 'koordinaty'
  | 'znak'
  | 'slozhenie'
  | 'vychitanie'
  | 'umnozhenie'
  | 'dlina'
  | 'skalyarnoe'
  | 'kosinus'
  | 'perpendikulyarnost'
  | 'svoystva';

const STSENY: Record<StsenaId, Risunok> = {
  /* Вектор из A(2; 2) в B(6; 5): конец минус начало — (4; 3). */
  koordinaty: {
    vectors: [{ name: 'a', from: [2, 2], to: [6, 5] }],
    window: { xmin: -1, xmax: 8, ymin: -1, ymax: 7 },
    hints: true,
    alt: 'Вектор a из точки (2; 2) в точку (6; 5) с катетами 4 и 3',
  },
  /* Пример из теории: из (4; 9) в (1; 5) — конец левее и ниже. */
  znak: {
    vectors: [{ name: 'a', from: [4, 9], to: [1, 5] }],
    window: { xmin: -1, xmax: 7, ymin: -1, ymax: 11 },
    hints: true,
    alt: 'Вектор a из точки (4; 9) в точку (1; 5) с катетами 3 и 4',
  },
  /* Правило треугольника: b отложен от конца a, c = a + b. */
  slozhenie: {
    vectors: [
      { name: 'a', from: [1, 1], to: [5, 2] },
      { name: 'b', from: [5, 2], to: [7, 6] },
      { name: 'c', from: [1, 1], to: [7, 6] },
    ],
    window: { xmin: -1, xmax: 9, ymin: -1, ymax: 8 },
    alt: 'Векторы a и b отложены друг за другом, вектор c замыкает треугольник',
  },
  /* Разность: a и b из одной точки, c = a − b идёт от конца b к концу a. */
  vychitanie: {
    vectors: [
      { name: 'a', from: [1, 1], to: [7, 2] },
      { name: 'b', from: [1, 1], to: [3, 5] },
      { name: 'c', from: [3, 5], to: [7, 2] },
    ],
    window: { xmin: -1, xmax: 9, ymin: -1, ymax: 7 },
    alt: 'Векторы a и b из одной точки, вектор c соединяет их концы',
  },
  /* Умножение на число: b = 2a, c = −a. */
  umnozhenie: {
    vectors: [
      { name: 'a', from: [1, 1], to: [3, 2] },
      { name: 'b', from: [1, 4], to: [5, 6] },
      { name: 'c', from: [8, 2], to: [6, 1] },
    ],
    window: { xmin: -1, xmax: 10, ymin: -1, ymax: 8 },
    alt: 'Вектор a, вдвое длиннее него вектор b и противоположный вектор c',
  },
  /* Длина: катеты 4 и 3, гипотенуза 5. */
  dlina: {
    vectors: [{ name: 'a', from: [2, 1], to: [6, 4] }],
    window: { xmin: -1, xmax: 8, ymin: -1, ymax: 6 },
    hints: true,
    alt: 'Вектор a с катетами 4 и 3: его длина 5',
  },
  /* Два вектора из одной точки — между ними угол α. */
  skalyarnoe: {
    vectors: [
      { name: 'a', from: [1, 1], to: [6, 2] },
      { name: 'b', from: [1, 1], to: [3, 5] },
    ],
    window: { xmin: -1, xmax: 8, ymin: -1, ymax: 7 },
    alt: 'Векторы a и b из одной точки, между ними угол',
  },
  /* Косинус: a(3; 4), b(5; 0) — произведение 15, длины 5 и 5, cos = 0,6. */
  kosinus: {
    vectors: [
      { name: 'a', from: [1, 1], to: [4, 5] },
      { name: 'b', from: [1, 1], to: [6, 1] },
    ],
    window: { xmin: -1, xmax: 8, ymin: -1, ymax: 7 },
    alt: 'Векторы a(3; 4) и b(5; 0) из одной точки',
  },
  /* Перпендикулярность: (3; 1) и (−1; 3), произведение 0. */
  perpendikulyarnost: {
    vectors: [
      { name: 'a', from: [2, 1], to: [5, 2] },
      { name: 'b', from: [2, 1], to: [1, 4] },
    ],
    window: { xmin: -1, xmax: 7, ymin: -1, ymax: 6 },
    alt: 'Перпендикулярные векторы a(3; 1) и b(−1; 3)',
  },
  /* Три вектора для свойств скалярного произведения. */
  svoystva: {
    vectors: [
      { name: 'a', from: [1, 1], to: [3, 2] },
      { name: 'b', from: [4, 1], to: [5, 4] },
      { name: 'c', from: [6, 3], to: [9, 4] },
    ],
    window: { xmin: -1, xmax: 11, ymin: -1, ymax: 6 },
    alt: 'Три вектора a, b и c на сетке',
  },
};

/** Рисунок теории по ключу. */
export function stsena(id: StsenaId): Risunok {
  return STSENY[id];
}

export const STSENY_IDS = Object.keys(STSENY) as StsenaId[];
