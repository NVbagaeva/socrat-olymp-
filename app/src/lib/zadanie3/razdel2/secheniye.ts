/**
 * Раздел II, прототипы P03-24/25/26/27: плоскость через среднюю
 * линию основания треугольной призмы, параллельная боковому ребру.
 *
 * Треугольник основания в условии никак не задан (общий), поэтому
 * для независимой проверки берётся один и тот же удобный треугольник
 * (катеты 3 и 4, прямой угол) — от его формы результат не зависит:
 * боковая поверхность отсечённой части всегда ровно половина полной,
 * а её объём всегда ровно четверть полного, для любого треугольника.
 * Высота призмы подбирается так, чтобы получить нужную полную
 * величину, и дальше отсечённая часть считается по-настоящему —
 * суммой площадей её граней или объёмом её вершин, а не тем же
 * умножением на ½ или на ¼, которым получен ответ.
 */

import { prism, vertex } from '../../solid/figures';
import { hullVolume, polygonArea, polyhedronVolume } from '../../solid/measure';
import { midlineCutModel } from './drawings';
import { solveBySearch } from '../search';
import { chislo, formula, texChislo } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';

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

/* Канонический прямоугольный треугольник: катеты 3 и 4, периметр 12, площадь 6. */
const LEG_P = 3;
const LEG_Q = 4;
const PERIMETER = LEG_P + LEG_Q + Math.hypot(LEG_P, LEG_Q);
const AREA = (LEG_P * LEG_Q) / 2;

function canonicalPrism(h: number) {
  return prism(
    [
      [0, 0, 0],
      [LEG_P, 0, 0],
      [0, LEG_Q, 0],
    ],
    [0, 0, h],
  );
}

function mid(a: readonly [number, number, number], b: readonly [number, number, number]) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as const;
}

/** Настоящая боковая поверхность отсечённой части: сумма трёх граней. */
function cutLateralArea(h: number): number {
  const body = canonicalPrism(h);
  const v = (name: string) => vertex(body, name);
  const M = mid(v('C'), v('A'));
  const N = mid(v('C'), v('B'));
  const M1 = mid(v('C1'), v('A1'));
  const N1 = mid(v('C1'), v('B1'));
  return (
    polygonArea([v('C'), M, M1, v('C1')]) +
    polygonArea([v('C'), N, N1, v('C1')]) +
    polygonArea([M, N, N1, M1])
  );
}

/** Настоящий объём отсечённой части: выпуклая оболочка её шести вершин. */
function cutVolume(h: number): number {
  const body = canonicalPrism(h);
  const v = (name: string) => vertex(body, name);
  const M = mid(v('C'), v('A'));
  const N = mid(v('C'), v('B'));
  const M1 = mid(v('C1'), v('A1'));
  const N1 = mid(v('C1'), v('B1'));
  return hullVolume([v('C'), M, N, v('C1'), M1, N1]);
}

/** Настоящая полная боковая поверхность призмы: сумма трёх исходных граней. */
function fullLateralArea(h: number): number {
  const body = canonicalPrism(h);
  const v = (name: string) => vertex(body, name);
  return (
    polygonArea([v('A'), v('B'), v('B1'), v('A1')]) +
    polygonArea([v('B'), v('C'), v('C1'), v('B1')]) +
    polygonArea([v('C'), v('A'), v('A1'), v('C1')])
  );
}

const MIDLINE_ALT =
  'Треугольная призма, сечение через среднюю линию основания, параллельное боковому ребру';

/* ── P03-24. Полная боковая поверхность → боковая поверхность отсечённой части ── */

export const P03_24: Prototype = {
  id: 'P03-24',
  razdel: 'II',
  nazvanie: 'Боковая поверхность отсечённой призмы',
  tip: 'боковая поверхность отсечённой части — половина полной',
  zadachnik: [78, 81],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Площадь боковой поверхности треугольной призмы равна ${chislo(num(p, 'S'))}. Через среднюю линию ` +
    'основания призмы проведена плоскость, параллельная боковому ребру. Найдите площадь боковой ' +
    'поверхности отсечённой треугольной призмы.',

  dopustimo: (p) => num(p, 'S') > 0,
  otvet: (p) => num(p, 'S') / 2,
  poModeli: (p) => cutLateralArea(num(p, 'S') / PERIMETER),

  chertezh: () => midlineCutModel(MIDLINE_ALT),

  shagi: (p) => {
    const s = num(p, 'S');
    return [
      {
        text:
          'Отсечённая часть — призма с основанием, подобным исходному с коэффициентом ' +
          `${formula('\\tfrac{1}{2}')}: две её боковые грани — половины исходных, ` +
          'третья (по сечению) равна половине третьей исходной.',
      },
      {
        text: `Боковая поверхность отсечённой части: ${formula(`${texChislo(s)} : 2 = ${texChislo(s / 2)}`)}.`,
        value: s / 2,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 78', { S: 75 }),
    variant(2, 'задачник', 'задачник 79', { S: 47 }),
    variant(3, 'задачник', 'задачник 80', { S: 28 }),
    variant(4, 'задачник', 'задачник 81', { S: 24 }),
    variant(5, 'домашка', 'домашка 17, вариант 1', { S: 56 }, 28),
    variant(6, 'домашка', 'домашка 17, вариант 2', { S: 42 }, 21),
    variant(7, 'новый', 'новый', { S: 60 }),
    variant(8, 'новый', 'новый', { S: 84 }),
    variant(9, 'новый', 'новый', { S: 90 }),
    variant(10, 'новый', 'новый', { S: 33 }),
  ],
};

/* ── P03-25. Боковая поверхность отсечённой части → полная ──────── */

export const P03_25: Prototype = {
  id: 'P03-25',
  razdel: 'II',
  nazvanie: 'Боковая поверхность исходной призмы по отсечённой',
  tip: 'полная боковая поверхность — удвоенная отсечённая',
  zadachnik: [82, 85],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) =>
    'Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ' +
    `ребру. Площадь боковой поверхности отсечённой треугольной призмы равна ${chislo(num(p, 's'))}. ` +
    'Найдите площадь боковой поверхности исходной призмы.',

  dopustimo: (p) => num(p, 's') > 0,
  otvet: (p) => 2 * num(p, 's'),
  poModeli: (p) => {
    /* Высота подбирается по настоящей боковой поверхности отсечённой
       части, полная считается по граням — удвоения нигде нет. */
    const h = solveBySearch(num(p, 's'), cutLateralArea);
    return fullLateralArea(h);
  },

  chertezh: () => midlineCutModel(MIDLINE_ALT),

  shagi: (p) => {
    const s = num(p, 's');
    return [
      {
        text: 'Боковая поверхность отсечённой части — ровно половина полной, для любого треугольника в основании.',
      },
      {
        text: `Полная боковая поверхность: ${formula(`${texChislo(s)} \\cdot 2 = ${texChislo(2 * s)}`)}.`,
        value: 2 * s,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 82', { s: 37 }),
    variant(2, 'задачник', 'задачник 83', { s: 43 }),
    variant(3, 'задачник', 'задачник 84', { s: 36 }),
    variant(4, 'задачник', 'задачник 85', { s: 22 }),
    variant(5, 'новый', 'новый', { s: 30 }),
    variant(6, 'домашка', 'домашка 17, вариант 4', { s: 60 }, 120),
    variant(7, 'новый', 'новый', { s: 18 }),
    variant(8, 'новый', 'новый', { s: 27 }),
    variant(9, 'новый', 'новый', { s: 50 }),
    variant(10, 'новый', 'новый', { s: 19 }),
  ],
};

/* ── P03-26. Полный объём → объём отсечённой части ──────────────── */

export const P03_26: Prototype = {
  id: 'P03-26',
  razdel: 'II',
  nazvanie: 'Объём отсечённой призмы',
  tip: 'объём отсечённой части — четверть полного',
  zadachnik: [86, 89],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Через среднюю линию основания треугольной призмы, объём которой равен ${chislo(num(p, 'V'))}, ` +
    'проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.',

  dopustimo: (p) => num(p, 'V') > 0,
  otvet: (p) => num(p, 'V') / 4,
  poModeli: (p) => cutVolume(num(p, 'V') / AREA),

  chertezh: () => midlineCutModel(MIDLINE_ALT),

  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text:
          'Отсечённая часть подобна исходной призме с коэффициентом ' +
          `${formula('\\tfrac{1}{2}')} по основанию: её объём — ${formula('\\tfrac{1}{4}')} ` +
          'полного, для любого треугольника в основании.',
      },
      {
        text: `Объём отсечённой части: ${formula(`${texChislo(V)} : 4 = ${texChislo(V / 4)}`)}.`,
        value: V / 4,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 86', { V: 48 }),
    variant(2, 'задачник', 'задачник 87', { V: 52 }),
    variant(3, 'задачник', 'задачник 88', { V: 44 }),
    variant(4, 'задачник', 'задачник 89', { V: 56 }),
    variant(5, 'новый', 'новый', { V: 40 }),
    variant(6, 'новый', 'новый', { V: 60 }),
    variant(7, 'новый', 'новый', { V: 64 }),
    variant(8, 'новый', 'новый', { V: 72 }),
    variant(9, 'новый', 'новый', { V: 80 }),
    variant(10, 'новый', 'новый', { V: 96 }),
  ],
};

/* ── P03-27. Объём отсечённой части → полный ────────────────────── */

export const P03_27: Prototype = {
  id: 'P03-27',
  razdel: 'II',
  nazvanie: 'Объём исходной призмы по отсечённой',
  tip: 'полный объём — учетверённый объём отсечённой части',
  zadachnik: [90, 93],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    'Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ' +
    `ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен ${chislo(num(p, 'v'))}.`,

  dopustimo: (p) => num(p, 'v') > 0,
  otvet: (p) => 4 * num(p, 'v'),
  poModeli: (p) => {
    /* Высота подбирается по настоящему объёму отсечённой части. */
    const h = solveBySearch(num(p, 'v'), cutVolume);
    return polyhedronVolume(canonicalPrism(h));
  },

  chertezh: () => midlineCutModel(MIDLINE_ALT),

  shagi: (p) => {
    const v = num(p, 'v');
    return [
      {
        text: 'Объём отсечённой части — ровно четверть полного объёма, для любого треугольника в основании.',
      },
      {
        text: `Полный объём: ${formula(`${texChislo(v)} \\cdot 4 = ${texChislo(4 * v)}`)}.`,
        value: 4 * v,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 90', { v: 7 }),
    variant(2, 'задачник', 'задачник 91', { v: 5 }),
    variant(3, 'задачник', 'задачник 92', { v: 15 }),
    variant(4, 'задачник', 'задачник 93', { v: 12 }),
    variant(5, 'новый', 'новый', { v: 13 }),
    variant(6, 'домашка', 'домашка 18, вариант 2', { v: 8 }, 32),
    variant(7, 'домашка', 'домашка 18, вариант 3', { v: 10 }, 40),
    variant(8, 'домашка', 'домашка 18, вариант 4', { v: 6 }, 24),
    variant(9, 'новый', 'новый', { v: 9 }),
    variant(10, 'новый', 'новый', { v: 11 }),
  ],
};
