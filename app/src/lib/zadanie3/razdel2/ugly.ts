/**
 * Раздел II, прототипы P03-22/23/35: углы в правильных призмах.
 *
 * Ответ в этих трёх прототипах не зависит от числа «ребро равно N» —
 * оно стоит в условии только для правдоподобия, как в задачнике.
 * Ответ зависит от того, КАКАЯ пара прямых выбрана; для каждого
 * прототипа эта пара имеет фиксированный геометрический тип
 * (боковое ребро — диагональ грани, боковое ребро — ребро основания,
 * сторона шестиугольника — противолежащая сторона верхнего
 * основания), и внутри типа ответ один и тот же для любой такой пары.
 */

import { angleBetweenLines } from '../../solid/measure';
import { direction, regularPrismByEdge } from './common';
import { shapeHexLines, shapeTriLines, HEX_NAMES, TRI_NAMES } from './drawings';
import { ru, segment } from '../format';
import { type Params, type Prototype, type Variant, num, pair } from '../types';

function variant(
  n: number,
  source: Variant['source'],
  ref: string,
  params: Params,
  sourceAnswer?: number,
): Variant {
  return sourceAnswer === undefined
    ? { n, source, ref, params }
    : { n, source, ref, params, sourceAnswer };
}

/* ── P03-22. Угол между AA₁ и BC₁: боковое ребро и диагональ грани ── */

/** Диагонали боковых граней правильной треугольной призмы. */
const FACE_DIAGONALS = new Set(['AB1', 'BA1', 'BC1', 'CB1', 'CA1', 'AC1']);
const LATERALS = new Set(['AA1', 'BB1', 'CC1']);

function isFaceDiagonalPair(p: Params): boolean {
  const [l1, l2] = [pair(p, 'l1'), pair(p, 'l2')];
  const key = (x: readonly [string, string]) => x.join('');
  return LATERALS.has(key(l1)) && FACE_DIAGONALS.has(key(l2));
}

function triAngle(p: Params): number {
  const a = num(p, 'a');
  const body = regularPrismByEdge(3, a, a);
  return angleBetweenLines(direction(body, ...pair(p, 'l1')), direction(body, ...pair(p, 'l2')));
}

export const P03_22: Prototype = {
  id: 'P03-22',
  razdel: 'II',
  nazvanie: 'Угол AA₁ и BC₁ в правильной треугольной призме',
  tip: 'угол между боковым ребром и диагональю грани, ответ 45°',
  zadachnik: [74, 75],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной треугольной призме ${TRI_NAMES}, все рёбра которой равны ${ru(num(p, 'a'))}, ` +
    `найдите угол между прямыми ${segment(pair(p, 'l1'))} и ${segment(pair(p, 'l2'))}.`,

  dopustimo: (p) => num(p, 'a') > 0 && isFaceDiagonalPair(p),
  otvet: () => 45,
  poModeli: triAngle,

  chertezh: (p) => {
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    return shapeTriLines(
      `Правильная треугольная призма ${TRI_NAMES}, выделены прямые ${segment(l1)} и ${segment(l2)}`,
      [l1, l2],
    );
  },

  shagi: (p) => {
    const l1 = segment(pair(p, 'l1'));
    const l2 = segment(pair(p, 'l2'));
    return [
      {
        text: `${l1} — боковое ребро, ${l2} — диагональ боковой грани; все рёбра призмы равны, значит грань — квадрат.`,
      },
      {
        text: `Диагональ квадрата делит угол между стороной и диагональю пополам: 45°.`,
        value: 45,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 74', { a: 1, l1: ['A', 'A1'], l2: ['B', 'C1'] }),
    variant(2, 'задачник', 'задачник 75', { a: 2, l1: ['B', 'B1'], l2: ['A', 'C1'] }),
    variant(3, 'домашка', 'домашка 16, вариант 1', { a: 2, l1: ['A', 'A1'], l2: ['B', 'C1'] }, 45),
    variant(4, 'домашка', 'домашка 16, вариант 4', { a: 4, l1: ['B', 'B1'], l2: ['A', 'C1'] }, 45),
    variant(5, 'новый', 'новый', { a: 3, l1: ['C', 'C1'], l2: ['A', 'B1'] }),
    variant(6, 'новый', 'новый', { a: 5, l1: ['A', 'A1'], l2: ['C', 'B1'] }),
    variant(7, 'новый', 'новый', { a: 6, l1: ['B', 'B1'], l2: ['C', 'A1'] }),
    variant(8, 'новый', 'новый', { a: 7, l1: ['C', 'C1'], l2: ['B', 'A1'] }),
    variant(9, 'новый', 'новый', { a: 8, l1: ['A', 'A1'], l2: ['A', 'C1'] }),
    variant(10, 'новый', 'новый', { a: 9, l1: ['C', 'C1'], l2: ['C', 'B1'] }),
  ],
};

/* ── P03-23. Угол между AA₁ и BC: боковое ребро и ребро основания ── */

const BASE_EDGES = new Set(['AB', 'BA', 'BC', 'CB', 'CA', 'AC']);

function isBaseEdgePair(p: Params): boolean {
  const [l1, l2] = [pair(p, 'l1'), pair(p, 'l2')];
  const key = (x: readonly [string, string]) => x.join('');
  return LATERALS.has(key(l1)) && BASE_EDGES.has(key(l2));
}

export const P03_23: Prototype = {
  id: 'P03-23',
  razdel: 'II',
  nazvanie: 'Угол AA₁ и BC в правильной треугольной призме',
  tip: 'угол между боковым ребром и ребром основания, ответ 90°',
  zadachnik: [76, 77],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `В правильной треугольной призме ${TRI_NAMES}, все рёбра которой равны ${ru(num(p, 'a'))}, ` +
    `найдите угол между прямыми ${segment(pair(p, 'l1'))} и ${segment(pair(p, 'l2'))}.`,

  dopustimo: (p) => num(p, 'a') > 0 && isBaseEdgePair(p),
  otvet: () => 90,
  poModeli: triAngle,

  chertezh: (p) => {
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    return shapeTriLines(
      `Правильная треугольная призма ${TRI_NAMES}, выделены прямые ${segment(l1)} и ${segment(l2)}`,
      [l1, l2],
    );
  },

  shagi: (p) => {
    const l1 = segment(pair(p, 'l1'));
    const l2 = segment(pair(p, 'l2'));
    return [
      { text: `${l1} — боковое ребро призмы, оно перпендикулярно плоскости основания.` },
      {
        text: `${l2} лежит в плоскости основания, значит угол между ${l1} и ${l2} равен 90°.`,
        value: 90,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 76', { a: 1, l1: ['A', 'A1'], l2: ['B', 'C'] }),
    variant(2, 'задачник', 'задачник 77', { a: 2, l1: ['B', 'B1'], l2: ['A', 'C'] }),
    variant(3, 'домашка', 'домашка 16, вариант 1', { a: 4, l1: ['C', 'C1'], l2: ['A', 'B'] }, 90),
    variant(4, 'новый', 'новый', { a: 3, l1: ['A', 'A1'], l2: ['A', 'B'] }),
    variant(5, 'новый', 'новый', { a: 5, l1: ['B', 'B1'], l2: ['B', 'C'] }),
    variant(6, 'новый', 'новый', { a: 6, l1: ['C', 'C1'], l2: ['C', 'A'] }),
    variant(7, 'новый', 'новый', { a: 7, l1: ['A', 'A1'], l2: ['C', 'A'] }),
    variant(8, 'новый', 'новый', { a: 8, l1: ['B', 'B1'], l2: ['A', 'B'] }),
    variant(9, 'новый', 'новый', { a: 9, l1: ['C', 'C1'], l2: ['B', 'C'] }),
    variant(10, 'новый', 'новый', { a: 10, l1: ['A', 'A1'], l2: ['B', 'C'] }),
  ],
};

/* ── P03-35. Угол между сторонами оснований в шестиугольной призме ── */

/**
 * Все стороны правильного шестиугольника, кроме k, разбиваются на
 * «параллельную» (даёт 0°, вырожденный случай) и остальные — они
 * все дают 60°. Проверено по модели: единственная пара с нулём —
 * противолежащая сторона.
 */
const HEX_SIDES: readonly (readonly [string, string])[] = [
  ['A', 'B'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'E'],
  ['E', 'F'],
  ['F', 'A'],
];

function oppositeOf(side: readonly [string, string]): string {
  const i = HEX_SIDES.findIndex(([a, b]) => a === side[0] && b === side[1]);
  const [a, b] = HEX_SIDES[(i + 3) % 6] as [string, string];
  return a + b;
}

function isNonParallelSidePair(p: Params): boolean {
  const l1 = pair(p, 'l1');
  const l2raw = pair(p, 'l2');
  const l2 = [l2raw[0].replace(/1$/, ''), l2raw[1].replace(/1$/, '')] as [string, string];
  const isSide = (x: readonly string[]) => HEX_SIDES.some(([a, b]) => a === x[0] && b === x[1]);
  if (!isSide(l1) || !isSide(l2)) {
    return false;
  }
  return oppositeOf(l1) !== l2.join('');
}

function hexAngle(p: Params): number {
  const a = num(p, 'a');
  const body = regularPrismByEdge(6, a, a);
  return angleBetweenLines(direction(body, ...pair(p, 'l1')), direction(body, ...pair(p, 'l2')));
}

export const P03_35: Prototype = {
  id: 'P03-35',
  razdel: 'II',
  nazvanie: 'Угол между прямыми в правильной шестиугольной призме',
  tip: 'угол между стороной нижнего и стороной верхнего основания, ответ 60°',
  zadachnik: [110, 113],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной шестиугольной призме ${HEX_NAMES}, все рёбра которой равны ${ru(num(p, 'a'))}, ` +
    `найдите угол между прямыми ${segment(pair(p, 'l1'))} и ${segment(pair(p, 'l2'))}. Ответ дайте в градусах.`,

  dopustimo: (p) => num(p, 'a') > 0 && isNonParallelSidePair(p),
  otvet: () => 60,
  poModeli: hexAngle,

  chertezh: (p) => {
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    return shapeHexLines(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделены прямые ${segment(l1)} и ${segment(l2)}`,
      [l1, l2],
    );
  },

  shagi: (p) => {
    const l1 = segment(pair(p, 'l1'));
    const l2 = segment(pair(p, 'l2'));
    return [
      {
        text: `${l2} лежит в верхнем основании; перенесём её параллельно себе в нижнее основание — прямая не изменится.`,
      },
      {
        text: `${l1} и перенесённая ${l2} — стороны правильного шестиугольника, не соседние и не противоположные: угол между ними 60°.`,
        value: 60,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 110', { a: 5, l1: ['F', 'A'], l2: ['D1', 'E1'] }),
    variant(2, 'задачник', 'задачник 111', { a: 3, l1: ['C', 'D'], l2: ['E1', 'F1'] }),
    variant(3, 'домашка', 'домашка 21, вариант 2', { a: 6, l1: ['C', 'D'], l2: ['E1', 'F1'] }, 60),
    variant(4, 'новый', 'новый', { a: 4, l1: ['A', 'B'], l2: ['C1', 'D1'] }),
    variant(5, 'новый', 'новый', { a: 2, l1: ['B', 'C'], l2: ['D1', 'E1'] }),
    variant(6, 'новый', 'новый', { a: 7, l1: ['D', 'E'], l2: ['F1', 'A1'] }),
    variant(7, 'новый', 'новый', { a: 8, l1: ['E', 'F'], l2: ['A1', 'B1'] }),
    variant(8, 'новый', 'новый', { a: 9, l1: ['F', 'A'], l2: ['B1', 'C1'] }),
    variant(9, 'новый', 'новый', { a: 1, l1: ['A', 'B'], l2: ['C1', 'D1'] }),
    variant(10, 'новый', 'новый', { a: 10, l1: ['B', 'C'], l2: ['D1', 'E1'] }),
  ],
};
