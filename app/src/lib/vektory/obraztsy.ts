/**
 * Образцы рисунков для демо-страницы движка и его самотеста.
 *
 * Это не задачи: числа здесь — параметры рисунков, подобранные так,
 * чтобы показать каждый режим движка. Демо-страница (/styleguide/
 * vektory-2/) рисует их все; selftest.ts проверяет их отчёты.
 */

import type { Risunok } from './types';

export interface Obrazets {
  id: string;
  title: string;
  config: Risunok;
}

export const OBRAZTSY: Obrazets[] = [
  {
    id: 'dva',
    title: 'Сетка, два вектора (A6, B5, C2)',
    config: {
      vectors: [
        { name: 'a', from: [1, 1], to: [3, 5] },
        { name: 'b', from: [4, 4], to: [7, 2] },
      ],
      window: { xmin: -1, xmax: 9, ymin: -2, ymax: 7 },
      alt: 'Два вектора на сетке',
    },
  },
  {
    id: 'tri',
    title: 'Сетка, три вектора, поле по умолчанию (A7, A8, B8)',
    config: {
      vectors: [
        { name: 'a', from: [2, 2], to: [3, 5] },
        { name: 'b', from: [5, 2], to: [11, 1] },
        { name: 'c', from: [10, 6], to: [5, 8] },
      ],
      alt: 'Три вектора на сетке',
    },
  },
  {
    id: 'cherez-osi',
    title: 'Векторы пересекают оси, горизонтальный и вертикальный',
    config: {
      vectors: [
        { name: 'a', from: [-1, 3], to: [4, 6] },
        { name: 'b', from: [2, -1], to: [2, 2] },
        { name: 'c', from: [5, 1], to: [10, 1] },
      ],
      window: { xmin: -2, xmax: 11, ymin: -2, ymax: 8 },
      alt: 'Векторы, пересекающие оси',
    },
  },
  {
    id: 'podskazka',
    title: 'Режим подсказки: катеты смещений',
    config: {
      vectors: [
        { name: 'a', from: [1, 1], to: [5, 4] },
        { name: 'b', from: [7, 5], to: [10, 1] },
      ],
      window: { xmin: -1, xmax: 12, ymin: -2, ymax: 7 },
      hints: true,
      alt: 'Два вектора с катетами смещений',
    },
  },
  {
    id: 'podskazka-tri',
    title: 'Режим подсказки, три вектора, отрицательные смещения',
    config: {
      vectors: [
        { name: 'a', from: [4, 9], to: [1, 5] },
        { name: 'b', from: [6, 3], to: [12, 2] },
        { name: 'c', from: [11, 9], to: [7, 6] },
      ],
      hints: true,
      alt: 'Три вектора с катетами смещений',
    },
  },
  {
    id: 'bez-setki-nachalo',
    title: 'Без сетки, векторы из начала координат (B6)',
    config: {
      vectors: [
        { name: 'a', from: [0, 0], to: [3, 7] },
        { name: 'b', from: [0, 0], to: [8, 5] },
      ],
      window: { xmin: -1, xmax: 9, ymin: -1, ymax: 8 },
      grid: false,
      alt: 'Два вектора из начала координат без сетки',
    },
  },
  {
    id: 'bez-setki',
    title: 'Без сетки, векторы не из начала координат (B7)',
    config: {
      vectors: [
        { name: 'a', from: [2, 4], to: [5, 9] },
        { name: 'b', from: [1, 1], to: [9, 3] },
      ],
      window: { xmin: -1, xmax: 10, ymin: -1, ymax: 10 },
      grid: false,
      alt: 'Два вектора без сетки',
    },
  },
  {
    id: 'tesno',
    title: 'Окно по векторам (tight): миниатюра и телефон',
    config: {
      vectors: [
        { name: 'a', from: [1, 2], to: [4, 4] },
        { name: 'b', from: [7, 1], to: [5, 5] },
      ],
      window: 'tight',
      alt: 'Два вектора, окно по векторам',
    },
  },
  {
    id: 'rasshirenie',
    title: 'Окно расширено под вектор, вышедший за поле',
    config: {
      vectors: [
        { name: 'a', from: [2, 1], to: [6, 4] },
        { name: 'b', from: [8, 6], to: [15, 10] },
      ],
      window: { xmin: -1, xmax: 9, ymin: -2, ymax: 7 },
      alt: 'Окно расширено под вектор',
    },
  },
  {
    id: 'vlevo-vniz',
    title: 'Векторы во все стороны, подпись у острия',
    config: {
      vectors: [
        { name: 'a', from: [6, 6], to: [2, 3] },
        { name: 'b', from: [8, 1], to: [12, -1] },
        { name: 'c', from: [10, 9], to: [10, 5] },
      ],
      alt: 'Векторы во все стороны',
    },
  },
];
