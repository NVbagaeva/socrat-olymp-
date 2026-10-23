/**
 * Геометрия разборов основных типов задач про параболу (вкладка
 * «О задании» квадратичной подтемы, content/quadraticBasics.ts):
 * знак a, значение a, свободный член c, коэффициент b, формула по
 * графику, значение функции, аргумент по значению.
 *
 * Один источник для рисунков (lib/theoryFigures.ts) и для автотеста
 * (scripts/check-about-examples.mjs): тест пересчитывает по этим числам
 * ответ каждого примера независимо — по вершине и узлам, а не по
 * готовым коэффициентам — и проверяет, что ответ с рисунка не читается.
 *
 * Функция — y = a·x² + b·x + c; вершина (m; n), запись a(x − m)² + n.
 */

import type { Quad, Win } from '@/lib/quadraticCross';

export type BasicKind = 'sign' | 'a' | 'c' | 'b' | 'formula' | 'value' | 'argument';

export interface BasicExample {
  /** Ключ рисунка в lib/theoryFigures.ts. */
  figure: string;
  window: Win;
  /** Клетка рисунка в пикселях натурального размера. */
  cell: number;
  f: Quad;
  /** Отмеченные точки: вершина и узлы сетки на параболе. */
  marks: [number, number][];
  kind: BasicKind;
  /** Заданные в условии: x₀ для значения, y₀ и выбор корня для аргумента. */
  x0?: number;
  y0?: number;
  pick?: 'greater' | 'less';
  /** Варианты записи функции у «формулы по графику» и номер верного. */
  options?: Quad[];
  correct?: number;
  /** Ответ числом: a, c, b, значение или аргумент. У знака — −1 или 1. */
  answer: number;
}

const W: Win = { xmin: -5, xmax: 5, ymin: -6, ymax: 6 };
/* Точка в окне — клетка крупнее: подписям у точки и у осей хватает места.
   Точка за рамкой — обычная клетка. */
const CELL_NEAR = 44;
/* Окно разбора свободного члена: вершина (4; −1) и узел (5; 0) правее
   оси, поэтому окно сдвинуто вправо — узел не сидит на краю. */
const W_RIGHT: Win = { xmin: -3, xmax: 6, ymin: -6, ymax: 6 };
const CELL = 36;

/** Парабола по вершине (m; n) и коэффициенту a: a(x − m)² + n. */
export function byVertex(a: number, m: number, n: number): Quad {
  return { a, b: -2 * a * m, c: a * m * m + n };
}

export function valueAt(q: Quad, x: number): number {
  return q.a * x * x + q.b * x + q.c;
}

export const BASIC_EXAMPLES: Record<string, BasicExample[]> = {
  /* Вершина ниже оси Ox, а ветви вверх: знак a от положения вершины не
     зависит. Вершина (1; −3), a = 0,5. */
  'sign-a': [
    {
      figure: 'qb-sign-a',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(0.5, 1, -3),
      marks: [[1, -3]],
      kind: 'sign',
      answer: 1,
    },
  ],
  /* Вершина (−2; 1) и узел (0; 0): шаг 2 по x даёт −1 по y, a = −0,25. */
  'value-a': [
    {
      figure: 'qb-value-a',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(-0.25, -2, 1),
      marks: [
        [-2, 1],
        [0, 0],
      ],
      kind: 'a',
      answer: -0.25,
    },
  ],
  /* Парабола пересекает Oy на высоте 15 — за рамкой. Вершина (4; −1),
     узлы (3; 0) и (5; 0), a = 1. */
  'value-c': [
    {
      figure: 'qb-value-c',
      window: W_RIGHT,
      cell: CELL,
      f: byVertex(1, 4, -1),
      marks: [
        [4, -1],
        [3, 0],
        [5, 0],
      ],
      kind: 'c',
      answer: 15,
    },
  ],
  /* y = x² + bx + c, вершина (−2; −3): b = −2·1·(−2) = 4. */
  'value-b': [
    {
      figure: 'qb-value-b',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(1, -2, -3),
      marks: [[-2, -3]],
      kind: 'b',
      answer: 4,
    },
  ],
  /* Вершина (1; 3), узлы (−1; 1) и (3; 1), a = −0,5, c = 2,5 — не в узле. */
  formula: [
    {
      figure: 'qb-formula',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(-0.5, 1, 3),
      marks: [
        [1, 3],
        [-1, 1],
        [3, 1],
      ],
      kind: 'formula',
      options: [
        { a: -0.5, b: 1, c: 2.5 },
        { a: 0.5, b: -1, c: 2.5 },
        { a: -0.5, b: -1, c: 2.5 },
        { a: -0.5, b: 1, c: -2.5 },
      ],
      correct: 0,
      answer: 1,
    },
  ],
  /* f(2) на параболе с вершиной (−1; −3): точка (2; 1,5) в окне, не в узле. */
  'value-at': [
    {
      figure: 'qb-at-visible',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(0.5, -1, -3),
      marks: [
        [-1, -3],
        [1, -1],
      ],
      kind: 'value',
      x0: 2,
      answer: 1.5,
    },
    {
      figure: 'qb-at-outside',
      window: W,
      cell: CELL,
      f: byVertex(1, 1, -4),
      marks: [
        [1, -4],
        [3, 0],
      ],
      kind: 'value',
      x0: 7,
      answer: 32,
    },
  ],
  /* f(x) = 0,5 на параболе с вершиной (1; −4), a = 2: больший корень 2,5. */
  'argument-for': [
    {
      figure: 'qb-arg-visible',
      window: W,
      cell: CELL_NEAR,
      f: byVertex(2, 1, -4),
      marks: [
        [1, -4],
        [2, -2],
      ],
      kind: 'argument',
      y0: 0.5,
      pick: 'greater',
      answer: 2.5,
    },
    {
      figure: 'qb-arg-outside',
      window: W,
      cell: CELL,
      f: byVertex(1, 1, -4),
      marks: [
        [1, -4],
        [3, 0],
      ],
      kind: 'argument',
      y0: 45,
      pick: 'less',
      answer: -6,
    },
  ],
};

export function basicOfFigure(figure: string): BasicExample | undefined {
  return Object.values(BASIC_EXAMPLES)
    .flat()
    .find((item) => item.figure === figure);
}
