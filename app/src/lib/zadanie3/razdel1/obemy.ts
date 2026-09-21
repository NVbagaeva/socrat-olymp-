/**
 * Раздел I, прототипы P03-12 … P03-19: объёмы частей параллелепипеда.
 *
 * Условие перечисляет вершины части («многогранник с вершинами
 * A, B, C, A₁, B₁»), поэтому проверка по модели считает объём
 * выпуклой оболочки этих вершин: грани при этом не задаются руками,
 * а находятся сами. Формула прототипа («половина», «треть»,
 * «шестая часть») с этим объёмом обязана совпасть.
 */

import { vertex } from '../../solid/figures';
import { hullVolume, polyhedronVolume } from '../../solid/measure';
import { NAMES, cubeCutPrism, shapeLines, shapeSection } from '../../solid/drawings/section1';
import { type Vec3 } from '../../solid/vec';
import { letters, round, ru, tex } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';
import { boxOf } from './common';

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

function abc(p: Params): [number, number, number] {
  return [num(p, 'a'), num(p, 'b'), num(p, 'c')];
}

function positive(p: Params): boolean {
  return abc(p).every((x) => x > 0);
}

/** Объём части параллелепипеда по перечню её вершин. */
function partVolume(p: Params, names: readonly string[]): number {
  const [a, b, c] = abc(p);
  const body = boxOf(a, b, c);
  return hullVolume(names.map((name) => vertex(body, name)));
}

/** Перечень вершин в условии: «A, B, C, A₁, B₁». */
function listed(names: readonly string[]): string {
  return names.map(letters).join(', ');
}

/* ── P03-12. Половина: A, B, C, A₁, B₁, C₁ ──────────────────────── */

const PART_12 = ['A', 'B', 'C', 'A1', 'B1', 'C1'];

export const P03_12: Prototype = {
  id: 'P03-12',
  razdel: 'I',
  nazvanie: 'Часть параллелепипеда A, B, C, A₁, B₁, C₁ (половина)',
  tip: 'объём части параллелепипеда',
  zadachnik: [42, 43],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известно, что AB=${ru(num(p, 'a'))}, ` +
    `BC=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. Найдите объём многогранника, ` +
    `вершинами которого являются точки ${listed(PART_12)}.`,

  dopustimo: positive,
  otvet: (p) => {
    const [a, b, c] = abc(p);
    return (a * b * c) / 2;
  },
  poModeli: (p) => partVolume(p, PART_12),

  chertezh: () =>
    shapeSection(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, выделена половина с вершинами A, B, C, A₁, B₁, C₁: она отсечена плоскостью ACC₁A₁`,
      ['A', 'C', 'C1', 'A1'],
    ),

  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      {
        text: 'Плоскость ACC₁A₁ делит параллелепипед на две равные призмы: перечисленные вершины — это одна из них.',
      },
      {
        text: 'Объём параллелепипеда — произведение трёх рёбер.',
        formula: `${tex(a)} \\cdot ${tex(b)} \\cdot ${tex(c)} = ${tex(round(a * b * c))}`,
        value: a * b * c,
      },
      {
        text: 'Призма — половина параллелепипеда.',
        formula: `\\dfrac{${tex(round(a * b * c))}}{2} = ${tex(round((a * b * c) / 2))}`,
        value: (a * b * c) / 2,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 42', { a: 8, b: 5, c: 4 }),
    variant(2, 'задачник', 'задачник 43', { a: 7, b: 6, c: 5 }),
    variant(3, 'домашка', 'домашка 9, вариант 1', { a: 6, b: 4, c: 4 }, 48),
    variant(4, 'домашка', 'домашка 9, вариант 2', { a: 3, b: 5, c: 4 }, 30),
    variant(5, 'домашка', 'домашка 9, вариант 3', { a: 10, b: 6, c: 4 }, 120),
    variant(6, 'домашка', 'домашка 9, вариант 4', { a: 5, b: 6, c: 5 }, 75),
    variant(7, 'новый', 'новый', { a: 4, b: 3, c: 2 }),
    variant(8, 'новый', 'новый', { a: 9, b: 4, c: 6 }),
    variant(9, 'новый', 'новый', { a: 6, b: 7, c: 4 }),
    variant(10, 'новый', 'новый', { a: 8, b: 3, c: 5 }),
  ],
};

/* ── P03-13. Половина: A, B, C, D, A₁, B₁ ───────────────────────── */

const PART_13 = ['A', 'B', 'C', 'D', 'A1', 'B1'];

export const P03_13: Prototype = {
  id: 'P03-13',
  razdel: 'I',
  nazvanie: 'Часть параллелепипеда A, B, C, D, A₁, B₁ (половина)',
  tip: 'объём части параллелепипеда',
  zadachnik: [44, 45],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известно, что AB=${ru(num(p, 'a'))}, ` +
    `BC=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. Найдите объём многогранника, ` +
    `вершинами которого являются точки ${listed(PART_13)}.`,

  dopustimo: positive,
  otvet: (p) => {
    const [a, b, c] = abc(p);
    return (a * b * c) / 2;
  },
  poModeli: (p) => partVolume(p, PART_13),

  chertezh: () =>
    shapeSection(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, выделена часть с вершинами A, B, C, D, A₁, B₁: она отсечена плоскостью A₁B₁CD`,
      ['A1', 'B1', 'C', 'D'],
    ),

  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      {
        text: 'Плоскость A₁B₁CD делит параллелепипед на две равные части: перечисленные вершины — одна из них, клин с основанием ABCD и ребром A₁B₁.',
      },
      {
        text: 'Объём параллелепипеда — произведение трёх рёбер.',
        formula: `${tex(a)} \\cdot ${tex(b)} \\cdot ${tex(c)} = ${tex(round(a * b * c))}`,
        value: a * b * c,
      },
      {
        text: 'Искомая часть — половина параллелепипеда.',
        formula: `\\dfrac{${tex(round(a * b * c))}}{2} = ${tex(round((a * b * c) / 2))}`,
        value: (a * b * c) / 2,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 44', { a: 6, b: 5, c: 4 }),
    variant(2, 'задачник', 'задачник 45', { a: 5, b: 4, c: 3 }),
    variant(3, 'новый', 'новый', { a: 8, b: 5, c: 4 }),
    variant(4, 'новый', 'новый', { a: 7, b: 6, c: 4 }),
    variant(5, 'новый', 'новый', { a: 4, b: 3, c: 6 }),
    variant(6, 'новый', 'новый', { a: 9, b: 4, c: 5 }),
    variant(7, 'новый', 'новый', { a: 6, b: 6, c: 3 }),
    variant(8, 'новый', 'новый', { a: 10, b: 3, c: 4 }),
    variant(9, 'новый', 'новый', { a: 5, b: 8, c: 3 }),
    variant(10, 'новый', 'новый', { a: 12, b: 5, c: 4 }),
  ],
};

/* ── P03-14. Половина: A, D₁, A₁, B, C₁, B₁ ─────────────────────── */

const PART_14 = ['A', 'D1', 'A1', 'B', 'C1', 'B1'];

export const P03_14: Prototype = {
  id: 'P03-14',
  razdel: 'I',
  nazvanie: 'Часть параллелепипеда A, D₁, A₁, B, C₁, B₁ (половина)',
  tip: 'объём части параллелепипеда',
  zadachnik: [46, 47],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Найдите объём многогранника, вершинами которого являются точки ${listed(PART_14)} ` +
    `прямоугольного параллелепипеда ${NAMES}, у которого AB=${ru(num(p, 'a'))}, ` +
    `AD=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}.`,

  dopustimo: positive,
  otvet: (p) => {
    const [a, b, c] = abc(p);
    return (a * b * c) / 2;
  },
  poModeli: (p) => partVolume(p, PART_14),

  chertezh: () =>
    shapeSection(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, выделена часть с вершинами A, D₁, A₁, B, C₁, B₁: она отсечена плоскостью ABC₁D₁`,
      ['A', 'B', 'C1', 'D1'],
    ),

  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      {
        text: 'Плоскость ABC₁D₁ делит параллелепипед на две равные призмы: перечисленные вершины — одна из них.',
      },
      {
        text: 'Объём параллелепипеда — произведение трёх рёбер.',
        formula: `${tex(a)} \\cdot ${tex(b)} \\cdot ${tex(c)} = ${tex(round(a * b * c))}`,
        value: a * b * c,
      },
      {
        text: 'Искомая часть — половина параллелепипеда.',
        formula: `\\dfrac{${tex(round(a * b * c))}}{2} = ${tex(round((a * b * c) / 2))}`,
        value: (a * b * c) / 2,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 46', { a: 3, b: 4, c: 5 }),
    variant(2, 'задачник', 'задачник 47', { a: 4, b: 3, c: 8 }),
    variant(3, 'домашка', 'домашка 10, вариант 1', { a: 6, b: 7, c: 10 }, 210),
    variant(4, 'домашка', 'домашка 10, вариант 2', { a: 3, b: 5, c: 8 }, 60),
    variant(5, 'домашка', 'домашка 10, вариант 3', { a: 4, b: 4, c: 3 }, 24),
    variant(6, 'домашка', 'домашка 10, вариант 4', { a: 8, b: 4, c: 4 }, 64),
    variant(7, 'новый', 'новый', { a: 5, b: 6, c: 4 }),
    variant(8, 'новый', 'новый', { a: 7, b: 4, c: 6 }),
    variant(9, 'новый', 'новый', { a: 9, b: 5, c: 4 }),
    variant(10, 'новый', 'новый', { a: 6, b: 3, c: 7 }),
  ],
};

/* ── P03-15 и P03-16. Куб и отсечённая от него призма ───────────── */

/**
 * Треугольная призма, отсекаемая от куба с ребром a: плоскость идёт
 * через середины двух рёбер, выходящих из вершины B, и параллельна
 * третьему ребру BB₁.
 */
function cutPrismPoints(a: number): Vec3[] {
  const body = boxOf(a, a, a);
  const m: Vec3 = [a / 2, 0, 0];
  const n: Vec3 = [a, a / 2, 0];
  const b = vertex(body, 'B');
  return [m, n, b, [m[0], m[1], a], [n[0], n[1], a], [b[0], b[1], a]];
}

/**
 * Найти ребро куба по известному объёму: тот же ответ, но полученный
 * не делением на восемь, а подбором по самой модели. Объём растёт
 * с ребром, поэтому хватает половинного деления.
 */
function solveEdge(target: number, volumeOf: (a: number) => number): number {
  let lo = 0;
  let hi = 1;
  while (volumeOf(hi) < target) {
    hi *= 2;
  }
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (volumeOf(mid) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

const cubeVolumeOf = (a: number) => polyhedronVolume(boxOf(a, a, a));
const prismVolumeOf = (a: number) => hullVolume(cutPrismPoints(a));

/** Хвост формулировки задачника: он длинный и одинаковый у двух прототипов. */
const cutText = (from: 'от куба' | 'от него') =>
  `треугольной призмы, отсекаемой ${from} плоскостью, проходящей через середины ` +
  'двух рёбер, выходящих из одной вершины, и параллельной третьему ребру, ' +
  'выходящему из этой же вершины';

export const P03_15: Prototype = {
  id: 'P03-15',
  razdel: 'I',
  nazvanie: 'Призма, отсечённая от куба → объём куба',
  tip: 'объём куба по объёму отсечённой призмы',
  zadachnik: [48, 50],
  status: 'есть',
  format: 'целое',

  uslovie: (p) => `Объём ${cutText('от куба')}, равен ${ru(num(p, 'v'))}. Найдите объём куба.`,

  dopustimo: (p) => num(p, 'v') > 0,
  otvet: (p) => 8 * num(p, 'v'),
  poModeli: (p) => cubeVolumeOf(solveEdge(num(p, 'v'), prismVolumeOf)),

  chertezh: () =>
    cubeCutPrism(
      'Куб, от него отсечена треугольная призма: плоскость проходит через середины двух рёбер, выходящих из одной вершины, и параллельна третьему',
    ),

  shagi: (p) => {
    const v = num(p, 'v');
    return [
      {
        text: 'Отсечённая призма — прямая, её основание — прямоугольный треугольник с катетами по половине ребра куба.',
      },
      {
        text: 'Объём такой призмы — половина произведения катетов на высоту. Выходит восьмая часть объёма куба.',
        formula:
          '\\dfrac{1}{2} \\cdot \\dfrac{a}{2} \\cdot \\dfrac{a}{2} \\cdot a = \\dfrac{a^3}{8}',
      },
      {
        text: 'Значит объём куба в восемь раз больше объёма призмы.',
        formula: `8 \\cdot ${tex(v)} = ${tex(round(8 * v))}`,
        value: 8 * v,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 48', { v: 1.5 }),
    variant(2, 'задачник', 'задачник 49', { v: 3.5 }),
    variant(3, 'задачник', 'задачник 50', { v: 2.5 }),
    variant(4, 'домашка', 'домашка 11, вариант 2', { v: 0.5 }, 4),
    variant(5, 'домашка', 'домашка 11, вариант 4', { v: 1 }, 8),
    variant(6, 'новый', 'новый', { v: 2 }),
    variant(7, 'новый', 'новый', { v: 3 }),
    variant(8, 'новый', 'новый', { v: 4.5 }),
    variant(9, 'новый', 'новый', { v: 5 }),
    variant(10, 'новый', 'новый', { v: 6.5 }),
  ],
};

export const P03_16: Prototype = {
  id: 'P03-16',
  razdel: 'I',
  nazvanie: 'Объём куба → отсечённая призма',
  tip: 'объём отсечённой призмы по объёму куба',
  zadachnik: [51, 53],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) => `Объём куба равен ${ru(num(p, 'V'))}. Найдите объём ${cutText('от него')}.`,

  dopustimo: (p) => num(p, 'V') > 0,
  otvet: (p) => num(p, 'V') / 8,
  poModeli: (p) => prismVolumeOf(solveEdge(num(p, 'V'), cubeVolumeOf)),

  chertezh: () =>
    cubeCutPrism(
      'Куб, от него отсечена треугольная призма: плоскость проходит через середины двух рёбер, выходящих из одной вершины, и параллельна третьему',
    ),

  shagi: (p) => {
    const v = num(p, 'V');
    return [
      {
        text: 'Отсечённая призма — прямая, её основание — прямоугольный треугольник с катетами по половине ребра куба.',
      },
      {
        text: 'Объём такой призмы — половина произведения катетов на высоту. Выходит восьмая часть объёма куба.',
        formula:
          '\\dfrac{1}{2} \\cdot \\dfrac{a}{2} \\cdot \\dfrac{a}{2} \\cdot a = \\dfrac{a^3}{8}',
      },
      {
        text: 'Значит объём призмы — восьмая часть данного объёма куба.',
        formula: `\\dfrac{${tex(v)}}{8} = ${tex(round(v / 8))}`,
        value: v / 8,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 51', { V: 20 }),
    variant(2, 'задачник', 'задачник 52', { V: 4 }),
    variant(3, 'задачник', 'задачник 53', { V: 12 }),
    variant(4, 'новый', 'новый', { V: 8 }),
    variant(5, 'новый', 'новый', { V: 16 }),
    variant(6, 'новый', 'новый', { V: 24 }),
    variant(7, 'новый', 'новый', { V: 28 }),
    variant(8, 'новый', 'новый', { V: 32 }),
    variant(9, 'новый', 'новый', { V: 40 }),
    variant(10, 'новый', 'новый', { V: 48 }),
  ],
};

/* ── P03-17. Пирамида A, B, C, D, B₁ ────────────────────────────── */

const PART_17 = ['A', 'B', 'C', 'D', 'B1'];

export const P03_17: Prototype = {
  id: 'P03-17',
  razdel: 'I',
  nazvanie: 'Пирамида A, B, C, D, B₁ в параллелепипеде',
  tip: 'объём пирамиды внутри параллелепипеда',
  zadachnik: [54, 57],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Найдите объём многогранника, вершинами которого являются вершины ${listed(PART_17)} ` +
    `прямоугольного параллелепипеда ${NAMES}, у которого AB=${ru(num(p, 'a'))}, ` +
    `BC=${ru(num(p, 'b'))}, BB₁=${ru(num(p, 'c'))}.`,

  dopustimo: positive,
  otvet: (p) => {
    const [a, b, c] = abc(p);
    return (a * b * c) / 3;
  },
  poModeli: (p) => partVolume(p, PART_17),

  chertezh: () =>
    shapeLines(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, выделена пирамида с основанием ABCD и вершиной B₁`,
      [
        ['A', 'B1'],
        ['C', 'B1'],
        ['D', 'B1'],
      ],
    ),

  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      { text: 'Это пирамида с основанием ABCD и вершиной B₁; её высота — боковое ребро BB₁.' },
      {
        text: 'Основание — прямоугольник, его площадь есть произведение сторон.',
        formula: `${tex(a)} \\cdot ${tex(b)} = ${tex(round(a * b))}`,
        value: a * b,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(round(a * b))} \\cdot ${tex(c)}}{3} = \\dfrac{${tex(round(a * b * c))}}{3} = ${tex(round((a * b * c) / 3))}`,
        value: (a * b * c) / 3,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 54', { a: 4, b: 7, c: 3 }),
    variant(2, 'задачник', 'задачник 55', { a: 9, b: 3, c: 8 }),
    variant(3, 'задачник', 'задачник 56', { a: 3, b: 6, c: 5 }),
    variant(4, 'задачник', 'задачник 57', { a: 7, b: 8, c: 3 }),
    variant(5, 'домашка', 'домашка 12, вариант 1', { a: 3, b: 7, c: 2 }, 14),
    variant(6, 'домашка', 'домашка 12, вариант 2', { a: 9, b: 7, c: 6 }, 126),
    variant(7, 'домашка', 'домашка 12, вариант 3', { a: 8, b: 4, c: 3 }, 32),
    variant(8, 'домашка', 'домашка 12, вариант 4', { a: 5, b: 9, c: 5 }, 75),
    variant(9, 'новый', 'новый', { a: 6, b: 5, c: 4 }),
    variant(10, 'новый', 'новый', { a: 9, b: 4, c: 5 }),
  ],
};

/* ── P03-18. Многогранник A, B, C, A₁, B₁ в правильной призме ───── */

const PART_18 = ['A', 'B', 'C', 'A1', 'B1'];

export const P03_18: Prototype = {
  id: 'P03-18',
  razdel: 'I',
  nazvanie: 'Многогранник A, B, C, A₁, B₁ в правильной призме',
  tip: 'объём части призмы по площади основания',
  zadachnik: [58, 61],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Дана правильная четырёхугольная призма ${NAMES}, площадь основания которой равна ` +
    `${ru(num(p, 'S'))}, а боковое ребро равно ${ru(num(p, 'h'))}. Найдите объём ` +
    `многогранника, вершинами которого являются точки ${listed(PART_18)}.`,

  dopustimo: (p) => num(p, 'S') > 0 && num(p, 'h') > 0,

  otvet: (p) => (num(p, 'S') * num(p, 'h')) / 3,

  poModeli: (p) => {
    /* Основание — квадрат площади S, значит его сторона √S. */
    const a = Math.sqrt(num(p, 'S'));
    const body = boxOf(a, a, num(p, 'h'));
    return hullVolume(PART_18.map((name) => vertex(body, name)));
  },

  chertezh: () =>
    shapeLines(
      'prism',
      `Правильная четырёхугольная призма ${NAMES}, выделен многогранник с вершинами A, B, C, A₁, B₁`,
      [
        ['A', 'C'],
        ['C', 'A1'],
        ['C', 'B1'],
      ],
    ),

  shagi: (p) => {
    const s = num(p, 'S');
    const h = num(p, 'h');
    return [
      {
        text: 'Разобьём тело на две пирамиды с общей вершиной C: их основания — половины боковой грани ABB₁A₁.',
      },
      {
        text: 'Объём призмы — произведение площади основания на высоту.',
        formula: `${tex(s)} \\cdot ${tex(h)} = ${tex(round(s * h))}`,
        value: s * h,
      },
      {
        text: 'Тело занимает треть призмы.',
        formula: `\\dfrac{${tex(round(s * h))}}{3} = ${tex(round((s * h) / 3))}`,
        value: (s * h) / 3,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 58', { S: 6, h: 7 }),
    variant(2, 'задачник', 'задачник 59', { S: 6, h: 6 }),
    variant(3, 'задачник', 'задачник 60', { S: 3, h: 10 }),
    variant(4, 'задачник', 'задачник 61', { S: 5, h: 9 }),
    variant(5, 'домашка', 'домашка 13, вариант 1', { S: 6, h: 4 }, 8),
    variant(6, 'домашка', 'домашка 13, вариант 2', { S: 12, h: 10 }, 40),
    variant(7, 'домашка', 'домашка 13, вариант 3', { S: 5, h: 6 }, 10),
    variant(8, 'домашка', 'домашка 13, вариант 4', { S: 3, h: 4 }, 4),
    variant(9, 'новый', 'новый', { S: 9, h: 8 }),
    variant(10, 'новый', 'новый', { S: 12, h: 5 }),
  ],
};

/* ── P03-19. Тетраэдр A, B, C, B₁ ───────────────────────────────── */

const PART_19 = ['A', 'B', 'C', 'B1'];

export const P03_19: Prototype = {
  id: 'P03-19',
  razdel: 'I',
  nazvanie: 'Тетраэдр A, B, C, B₁ в параллелепипеде',
  tip: 'объём тетраэдра внутри параллелепипеда',
  zadachnik: [62, 65],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известно, что AB=${ru(num(p, 'a'))}, ` +
    `BC=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. Найдите объём многогранника, ` +
    `вершинами которого являются точки ${listed(PART_19)}.`,

  dopustimo: positive,
  otvet: (p) => {
    const [a, b, c] = abc(p);
    return (a * b * c) / 6;
  },
  poModeli: (p) => partVolume(p, PART_19),

  chertezh: () =>
    shapeLines('box', `Прямоугольный параллелепипед ${NAMES}, выделен тетраэдр A, B, C, B₁`, [
      ['A', 'C'],
      ['A', 'B1'],
      ['C', 'B1'],
    ]),

  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      {
        text: 'Это пирамида с основанием ABC — половиной основания параллелепипеда — и высотой BB₁.',
      },
      {
        text: 'Основание — половина прямоугольника, значит его площадь вдвое меньше произведения сторон.',
        formula: `\\dfrac{${tex(a)} \\cdot ${tex(b)}}{2} = \\dfrac{${tex(round(a * b))}}{2} = ${tex(round((a * b) / 2))}`,
        value: (a * b) / 2,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(round((a * b) / 2))} \\cdot ${tex(c)}}{3} = \\dfrac{${tex(round((a * b * c) / 2))}}{3} = ${tex(round((a * b * c) / 6))}`,
        value: (a * b * c) / 6,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 62', { a: 9, b: 7, c: 6 }),
    variant(2, 'задачник', 'задачник 63', { a: 7, b: 6, c: 5 }),
    variant(3, 'задачник', 'задачник 64', { a: 6, b: 5, c: 4 }),
    variant(4, 'задачник', 'задачник 65', { a: 9, b: 6, c: 5 }),
    variant(5, 'домашка', 'домашка 14, вариант 1', { a: 3, b: 4, c: 4 }, 8),
    variant(6, 'домашка', 'домашка 14, вариант 2', { a: 9, b: 8, c: 2 }, 24),
    variant(7, 'домашка', 'домашка 14, вариант 3', { a: 7, b: 6, c: 2 }, 14),
    variant(8, 'домашка', 'домашка 14, вариант 4', { a: 3, b: 9, c: 6 }, 27),
    variant(9, 'новый', 'новый', { a: 8, b: 6, c: 3 }),
    variant(10, 'новый', 'новый', { a: 5, b: 4, c: 6 }),
  ],
};
