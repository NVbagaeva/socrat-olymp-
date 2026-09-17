/**
 * Раздел III, прототипы P03-41…43: правильная четырёхугольная
 * пирамида SABCD, точка O — центр основания. Три прототипа — три
 * пары «дано / найти» в одном и том же прямоугольном треугольнике
 * SOA (или SOB, SOC, SOD): SO — высота, половина диагонали —
 * катет, боковое ребро — гипотенуза. Из любых двух находится
 * третье, буква ребра и диагонали — только для правдоподобия текста.
 */

import { regularPyramidByEdge, point } from './common';
import { distance } from '../../solid/measure';
import { shapeHeightDiagonals, NAMES4 } from './drawings';
import { ru } from '../format';
import { type Params, type Prototype, type Variant, num, text } from '../types';

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

const ALT = `Правильная четырёхугольная пирамида ${NAMES4}, O — центр основания, показаны высота SO и диагонали AC и BD`;

/* ── P03-41. Высота SO по боковому ребру и диагонали ────────────── */

export const P03_41: Prototype = {
  id: 'P03-41',
  razdel: 'III',
  nazvanie: 'Высота SO по боковому ребру и диагонали',
  tip: 'высота пирамиды по боковому ребру и диагонали основания',
  zadachnik: [126, 129],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде SABCD с вершиной S точка O — центр основания, ` +
    `${text(p, 'edge')}=${ru(num(p, 'sd'))}, BD=${ru(num(p, 'bd'))}. Найдите длину отрезка SO.`,

  dopustimo: (p) => num(p, 'sd') > num(p, 'bd') / 2 && num(p, 'bd') > 0,

  otvet: (p) => {
    const half = num(p, 'bd') / 2;
    return Math.sqrt(num(p, 'sd') * num(p, 'sd') - half * half);
  },

  poModeli: (p) => {
    /* Сторона квадрата из диагонали и настоящая, независимо посчитанная
       высота — строим пирамиду и меряем расстояние S от центра базы. */
    const side = num(p, 'bd') / Math.SQRT2;
    const half = num(p, 'bd') / 2;
    const h = Math.sqrt(num(p, 'sd') * num(p, 'sd') - half * half);
    const body = regularPyramidByEdge(4, side, h);
    return distance(point(body, 'S'), [0, 0, 0]);
  },

  chertezh: () => shapeHeightDiagonals(ALT),

  shagi: (p) => {
    const sd = num(p, 'sd');
    const bd = num(p, 'bd');
    const half = bd / 2;
    const so = Math.sqrt(sd * sd - half * half);
    return [
      { text: `Половина диагонали: BD : 2 = ${ru(bd)} : 2 = ${ru(half)}.`, value: half },
      {
        text: `Треугольник, образованный высотой, половиной диагонали и боковым ребром, прямоугольный: SO = √(${ru(sd)}² − ${ru(half)}²) = ${ru(so)}.`,
        value: so,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 126', { edge: 'SD', sd: 41, bd: 18 }),
    variant(2, 'задачник', 'задачник 127', { edge: 'SA', sd: 34, bd: 32 }),
    variant(3, 'задачник', 'задачник 128', { edge: 'SC', sd: 35, bd: 42 }),
    variant(4, 'задачник', 'задачник 129', { edge: 'SD', sd: 26, bd: 20 }),
    variant(5, 'домашка', 'домашка 25, вариант 1', { edge: 'SD', sd: 25, bd: 14 }, 24),
    variant(6, 'новый', 'новый', { edge: 'SB', sd: 41, bd: 80 }),
    variant(7, 'новый', 'новый', { edge: 'SB', sd: 20, bd: 24 }),
    variant(8, 'новый', 'новый', { edge: 'SA', sd: 17, bd: 16 }),
    variant(9, 'новый', 'новый', { edge: 'SC', sd: 13, bd: 10 }),
    variant(10, 'новый', 'новый', { edge: 'SD', sd: 17, bd: 30 }),
  ],
};

/* ── P03-42. Боковое ребро по SO и диагонали ────────────────────── */

export const P03_42: Prototype = {
  id: 'P03-42',
  razdel: 'III',
  nazvanie: 'Боковое ребро по SO и диагонали',
  tip: 'боковое ребро пирамиды по высоте и диагонали основания',
  zadachnik: [130, 131],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде SABCD с вершиной S точка O — центр основания, ` +
    `SO=${ru(num(p, 'so'))}, BD=${ru(num(p, 'bd'))}. Найдите длину отрезка ${text(p, 'edge')}.`,

  dopustimo: (p) => num(p, 'so') > 0 && num(p, 'bd') > 0,

  otvet: (p) => {
    const half = num(p, 'bd') / 2;
    return Math.sqrt(num(p, 'so') * num(p, 'so') + half * half);
  },

  poModeli: (p) => {
    const side = num(p, 'bd') / Math.SQRT2;
    const body = regularPyramidByEdge(4, side, num(p, 'so'));
    return distance(point(body, 'S'), point(body, 'A'));
  },

  chertezh: () => shapeHeightDiagonals(ALT),

  shagi: (p) => {
    const so = num(p, 'so');
    const bd = num(p, 'bd');
    const half = bd / 2;
    const sc = Math.sqrt(so * so + half * half);
    return [
      { text: `Половина диагонали: BD : 2 = ${ru(bd)} : 2 = ${ru(half)}.`, value: half },
      {
        text: `Боковое ребро — гипотенуза прямоугольного треугольника с катетами SO и половиной диагонали: ${text(p, 'edge')} = √(${ru(so)}² + ${ru(half)}²) = ${ru(sc)}.`,
        value: sc,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 130', { edge: 'SC', so: 28, bd: 42 }),
    variant(2, 'задачник', 'задачник 131', { edge: 'SA', so: 15, bd: 40 }),
    variant(3, 'новый', 'новый', { edge: 'SB', so: 20, bd: 30 }),
    variant(4, 'новый', 'новый', { edge: 'SD', so: 24, bd: 20 }),
    variant(5, 'новый', 'новый', { edge: 'SC', so: 9, bd: 24 }),
    variant(6, 'новый', 'новый', { edge: 'SA', so: 16, bd: 24 }),
    variant(7, 'новый', 'новый', { edge: 'SB', so: 12, bd: 10 }),
    variant(8, 'новый', 'новый', { edge: 'SD', so: 21, bd: 40 }),
    variant(9, 'новый', 'новый', { edge: 'SC', so: 8, bd: 12 }),
    variant(10, 'новый', 'новый', { edge: 'SA', so: 40, bd: 18 }),
  ],
};

/* ── P03-43. Диагональ основания по SO и боковому ребру ─────────── */

export const P03_43: Prototype = {
  id: 'P03-43',
  razdel: 'III',
  nazvanie: 'Диагональ основания по SO и боковому ребру',
  tip: 'диагональ основания по высоте и боковому ребру пирамиды',
  zadachnik: [132, 135],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде SABCD с вершиной S точка O — центр основания, ` +
    `SO=${ru(num(p, 'so'))}, ${text(p, 'edge')}=${ru(num(p, 'edge_v'))}. Найдите длину отрезка ${text(p, 'diag')}.`,

  dopustimo: (p) => num(p, 'edge_v') > num(p, 'so') && num(p, 'so') > 0,

  otvet: (p) => {
    const half = Math.sqrt(num(p, 'edge_v') * num(p, 'edge_v') - num(p, 'so') * num(p, 'so'));
    return 2 * half;
  },

  poModeli: (p) => {
    const half = Math.sqrt(num(p, 'edge_v') * num(p, 'edge_v') - num(p, 'so') * num(p, 'so'));
    const side = (2 * half) / Math.SQRT2;
    const body = regularPyramidByEdge(4, side, num(p, 'so'));
    return 2 * distance(point(body, 'A'), [0, 0, 0]);
  },

  chertezh: () => shapeHeightDiagonals(ALT),

  shagi: (p) => {
    const so = num(p, 'so');
    const ev = num(p, 'edge_v');
    const half = Math.sqrt(ev * ev - so * so);
    return [
      {
        text: `Половина диагонали — катет прямоугольного треугольника с гипотенузой ${text(p, 'edge')} и катетом SO: √(${ru(ev)}² − ${ru(so)}²) = ${ru(half)}.`,
        value: half,
      },
      { text: `Диагональ ${text(p, 'diag')}: ${ru(half)} · 2 = ${ru(2 * half)}.`, value: 2 * half },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 132', { edge: 'SC', edge_v: 73, so: 48, diag: 'AC' }),
    variant(2, 'задачник', 'задачник 133', { edge: 'SA', edge_v: 34, so: 30, diag: 'AC' }),
    variant(3, 'задачник', 'задачник 134', { edge: 'SA', edge_v: 37, so: 35, diag: 'BD' }),
    variant(4, 'задачник', 'задачник 135', { edge: 'SC', edge_v: 80, so: 48, diag: 'BD' }),
    variant(
      5,
      'домашка',
      'домашка 25, вариант 3',
      { edge: 'SC', edge_v: 25, so: 24, diag: 'AC' },
      14,
    ),
    variant(
      6,
      'домашка',
      'домашка 25, вариант 4',
      { edge: 'SA', edge_v: 17, so: 15, diag: 'BD' },
      16,
    ),
    variant(7, 'новый', 'новый', { edge: 'SD', edge_v: 20, so: 16, diag: 'AC' }),
    variant(8, 'новый', 'новый', { edge: 'SB', edge_v: 41, so: 40, diag: 'BD' }),
    variant(9, 'новый', 'новый', { edge: 'SC', edge_v: 13, so: 12, diag: 'AC' }),
    variant(10, 'новый', 'новый', { edge: 'SA', edge_v: 29, so: 21, diag: 'BD' }),
  ],
};
