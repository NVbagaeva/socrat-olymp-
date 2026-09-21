/**
 * Раздел II, прототипы P03-36…40: части правильной шестиугольной
 * призмы.
 *
 * Три семейства, каждое проверено по координатам:
 *  - треугольная призма на трёх соседних вершинах — шестая часть;
 *  - восьмивершинная призма на через-одну вершинах — две трети;
 *  - пирамида (основание — целое основание призмы, вершина —
 *    соседнее противоположное) — треть;
 *  - тетраэдр на трёх соседних вершинах одного уровня и одной
 *    вершине другого уровня — восемнадцатая часть.
 */

import { vertex } from '../../solid/figures';
import { hullVolume } from '../../solid/measure';
import { regularPrismByArea } from './common';
import { shapeHexSolid, HEX_NAMES } from './drawings';
import { round, ru, tex } from '../format';
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

function SH(p: Params): [number, number] {
  return [num(p, 'S'), num(p, 'h')];
}

function volumeOf(p: Params, names: readonly string[]): number {
  const [S, h] = SH(p);
  const body = regularPrismByArea(6, S, h);
  return hullVolume(names.map((name) => vertex(body, name)));
}

function condition(p: Params, names: readonly string[]): string {
  const [S, h] = SH(p);
  return (
    `Найдите объём многогранника, вершинами которого являются точки ${names.join(', ')} ` +
    `правильной шестиугольной призмы ${HEX_NAMES}, площадь основания которой равна ${ru(S)}, ` +
    `а боковое ребро равно ${ru(h)}.`
  );
}

/* ── P03-36. Треугольная призма, отсечённая от шестиугольной ────── */

export const P03_36: Prototype = {
  id: 'P03-36',
  razdel: 'II',
  nazvanie: 'Треугольная призма, отсечённая от шестиугольной',
  tip: 'объём призмы на трёх соседних вершинах — шестая часть',
  zadachnik: [114, 117],
  status: 'есть',
  format: 'целое',
  uslovie: (p) => condition(p, ['A', 'B', 'F', 'A1', 'B1', 'F1']),
  dopustimo: (p) => SH(p).every((x) => x > 0),
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 6;
  },
  poModeli: (p) => volumeOf(p, ['A', 'B', 'F', 'A1', 'B1', 'F1']),
  chertezh: () =>
    shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена треугольная призма с вершинами A, B, F, A₁, B₁, F₁`,
      [
        ['B', 'F'],
        ['B1', 'F1'],
      ],
    ),
  shagi: (p) => {
    const [S, h] = SH(p);
    return [
      {
        text: 'Три соседние вершины основания отсекают от правильного шестиугольника треугольник площадью S/6.',
      },
      {
        text: 'Объём отсечённой призмы — произведение этой площади на высоту.',
        formula: `\\dfrac{${tex(S)}}{6} \\cdot ${tex(h)} = \\dfrac{${tex(round(S * h))}}{6} = ${tex(round((S * h) / 6))}`,
        value: (S * h) / 6,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 114', { S: 8, h: 15 }),
    variant(2, 'задачник', 'задачник 115', { S: 12, h: 13 }),
    variant(3, 'задачник', 'задачник 116', { S: 6, h: 12 }),
    variant(4, 'задачник', 'задачник 117', { S: 8, h: 9 }),
    variant(5, 'домашка', 'домашка 22, вариант 4', { S: 12, h: 6 }, 12),
    variant(6, 'новый', 'новый', { S: 9, h: 6 }),
    variant(7, 'новый', 'новый', { S: 18, h: 4 }),
    variant(8, 'новый', 'новый', { S: 15, h: 6 }),
    variant(9, 'новый', 'новый', { S: 24, h: 3 }),
    variant(10, 'новый', 'новый', { S: 6, h: 15 }),
  ],
};

/* ── P03-37. Четырёхугольная призма внутри шестиугольной ─────────── */

export const P03_37: Prototype = {
  id: 'P03-37',
  razdel: 'II',
  nazvanie: 'Четырёхугольная призма внутри шестиугольной',
  tip: 'объём призмы на вершинах через одну — две трети',
  zadachnik: [118, 119],
  status: 'добавить',
  format: 'целое',
  uslovie: (p) => condition(p, ['A', 'C', 'D', 'F', 'A1', 'C1', 'D1', 'F1']),
  dopustimo: (p) => SH(p).every((x) => x > 0),
  otvet: (p) => {
    const [S, h] = SH(p);
    return (2 * S * h) / 3;
  },
  poModeli: (p) => volumeOf(p, ['A', 'C', 'D', 'F', 'A1', 'C1', 'D1', 'F1']),
  chertezh: () =>
    shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена призма с вершинами A, C, D, F, A₁, C₁, D₁, F₁`,
      [
        ['A', 'C'],
        ['D', 'F'],
        ['A1', 'C1'],
        ['D1', 'F1'],
      ],
    ),
  shagi: (p) => {
    const [S, h] = SH(p);
    return [
      {
        text: 'Четыре вершины через одну отсекают от шестиугольника два одинаковых треугольника, по шестой части основания каждый: остаются две трети.',
      },
      {
        text: 'Объём призмы над этой частью — произведение оставшейся площади на высоту.',
        formula: `\\dfrac{2}{3} \\cdot ${tex(S)} \\cdot ${tex(h)} = \\dfrac{2 \\cdot ${tex(round(S * h))}}{3} = ${tex(round((2 * S * h) / 3))}`,
        value: (2 * S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 118', { S: 9, h: 11 }),
    variant(2, 'задачник', 'задачник 119', { S: 7, h: 15 }),
    variant(3, 'новый', 'новый', { S: 6, h: 9 }),
    variant(4, 'новый', 'новый', { S: 12, h: 6 }),
    variant(5, 'новый', 'новый', { S: 15, h: 4 }),
    variant(6, 'новый', 'новый', { S: 9, h: 8 }),
    variant(7, 'новый', 'новый', { S: 18, h: 5 }),
    variant(8, 'новый', 'новый', { S: 21, h: 4 }),
    variant(9, 'новый', 'новый', { S: 6, h: 15 }),
    variant(10, 'новый', 'новый', { S: 24, h: 5 }),
  ],
};

/* ── P03-38. Пирамида с основанием A₁B₁C₁D₁E₁F₁ ──────────────────── */

const TOP_APEX = ['F', 'A', 'D'] as const;

export const P03_38: Prototype = {
  id: 'P03-38',
  razdel: 'II',
  nazvanie: 'Пирамида с основанием A₁B₁C₁D₁E₁F₁',
  tip: 'объём пирамиды: основание — верх призмы, вершина — нижняя',
  zadachnik: [120, 121],
  status: 'есть',
  format: 'целое',
  uslovie: (p) => {
    const apex = TOP_APEX[num(p, 'apex') % 3] as string;
    return condition(p, [apex, 'A1', 'B1', 'C1', 'D1', 'E1', 'F1']);
  },
  dopustimo: (p) => SH(p).every((x) => x > 0) && num(p, 'apex') >= 0 && num(p, 'apex') <= 2,
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 3;
  },
  poModeli: (p) => {
    const apex = TOP_APEX[num(p, 'apex') % 3] as string;
    return volumeOf(p, [apex, 'A1', 'B1', 'C1', 'D1', 'E1', 'F1']);
  },
  chertezh: (p) => {
    const apex = TOP_APEX[num(p, 'apex') % 3] as string;
    return shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена пирамида с основанием A₁B₁C₁D₁E₁F₁ и вершиной ${apex}`,
      ['A1', 'B1', 'C1', 'D1', 'E1']
        .filter((top) => top !== `${apex}1`)
        .map((top): [string, string] => [apex, top]),
    );
  },
  shagi: (p) => {
    const [S, h] = SH(p);
    const apex = TOP_APEX[num(p, 'apex') % 3] as string;
    return [
      {
        text: `Это пирамида с основанием A₁B₁C₁D₁E₁F₁ (площадь S) и вершиной ${apex}; высота — боковое ребро h.`,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(S)} \\cdot ${tex(h)}}{3} = \\dfrac{${tex(round(S * h))}}{3} = ${tex(round((S * h) / 3))}`,
        value: (S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 120', { S: 4, h: 3, apex: 0 }),
    variant(2, 'задачник', 'задачник 121', { S: 12, h: 2, apex: 2 }),
    variant(3, 'домашка', 'домашка 23, вариант 2', { S: 3, h: 4, apex: 0 }, 4),
    variant(4, 'домашка', 'домашка 23, вариант 4', { S: 6, h: 5, apex: 2 }, 10),
    variant(5, 'новый', 'новый', { S: 9, h: 4, apex: 1 }),
    variant(6, 'новый', 'новый', { S: 5, h: 6, apex: 0 }),
    variant(7, 'новый', 'новый', { S: 8, h: 3, apex: 2 }),
    variant(8, 'новый', 'новый', { S: 15, h: 4, apex: 1 }),
    variant(9, 'новый', 'новый', { S: 6, h: 9, apex: 0 }),
    variant(10, 'новый', 'новый', { S: 10, h: 3, apex: 2 }),
  ],
};

/* ── P03-39. Пирамида с основанием ABCDEF ────────────────────────── */

const BOTTOM_APEX_HEX = ['B1', 'A1', 'D1', 'E1'] as const;

export const P03_39: Prototype = {
  id: 'P03-39',
  razdel: 'II',
  nazvanie: 'Пирамида с основанием ABCDEF',
  tip: 'объём пирамиды: основание — низ призмы, вершина — верхняя',
  zadachnik: [122, 123],
  status: 'есть',
  format: 'целое',
  uslovie: (p) => {
    const apex = BOTTOM_APEX_HEX[num(p, 'apex') % 4] as string;
    return condition(p, ['A', 'B', 'C', 'D', 'E', 'F', apex]);
  },
  dopustimo: (p) => SH(p).every((x) => x > 0) && num(p, 'apex') >= 0 && num(p, 'apex') <= 3,
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 3;
  },
  poModeli: (p) => {
    const apex = BOTTOM_APEX_HEX[num(p, 'apex') % 4] as string;
    return volumeOf(p, ['A', 'B', 'C', 'D', 'E', 'F', apex]);
  },
  chertezh: (p) => {
    const apex = BOTTOM_APEX_HEX[num(p, 'apex') % 4] as string;
    return shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена пирамида с основанием ABCDEF и вершиной ${apex.replace('1', '₁')}`,
      ['A', 'B', 'C', 'D', 'E']
        .filter((base) => `${base}1` !== apex)
        .map((base): [string, string] => [apex, base]),
    );
  },
  shagi: (p) => {
    const [S, h] = SH(p);
    const apex = BOTTOM_APEX_HEX[num(p, 'apex') % 4] as string;
    return [
      {
        text: `Это пирамида с основанием ABCDEF (площадь S) и вершиной ${apex.replace('1', '₁')}; высота — боковое ребро h.`,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(S)} \\cdot ${tex(h)}}{3} = \\dfrac{${tex(round(S * h))}}{3} = ${tex(round((S * h) / 3))}`,
        value: (S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 122', { S: 5, h: 9, apex: 0 }),
    variant(2, 'задачник', 'задачник 123', { S: 10, h: 6, apex: 2 }),
    variant(3, 'домашка', 'домашка 24, вариант 1', { S: 3, h: 6, apex: 3 }, 6),
    variant(4, 'домашка', 'домашка 24, вариант 2', { S: 4, h: 3, apex: 1 }, 4),
    variant(5, 'домашка', 'домашка 24, вариант 4', { S: 6, h: 4, apex: 3 }, 8),
    variant(6, 'новый', 'новый', { S: 9, h: 4, apex: 0 }),
    variant(7, 'новый', 'новый', { S: 12, h: 5, apex: 2 }),
    variant(8, 'новый', 'новый', { S: 6, h: 9, apex: 1 }),
    variant(9, 'новый', 'новый', { S: 15, h: 4, apex: 3 }),
    variant(10, 'новый', 'новый', { S: 8, h: 3, apex: 0 }),
  ],
};

/* ── P03-40. Треугольная пирамида в шестиугольной призме ─────────── */

/**
 * P03-40 встречается в двух зеркальных видах: три верхние соседние
 * вершины плюс одна нижняя под первой из них (задачник 124), и три
 * нижние соседние плюс одна верхняя над средней (задачник 125). Обе
 * дают одну и ту же формулу Sh/18.
 */
function tetra40Names(p: Params): [string, string, string, string] {
  return num(p, 'mirror') === 1 ? ['C', 'D', 'E', 'D1'] : ['A1', 'B1', 'F1', 'A'];
}

export const P03_40: Prototype = {
  id: 'P03-40',
  razdel: 'II',
  nazvanie: 'Треугольная пирамида в шестиугольной призме',
  tip: 'объём тетраэдра на трёх соседних вершинах одного уровня и одной другого',
  zadachnik: [124, 125],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) => {
    const names = tetra40Names(p);
    return (
      `Найдите объём многогранника, вершинами которого являются вершины ${names.join(', ')} ` +
      `правильной шестиугольной призмы ${HEX_NAMES}, площадь основания которой равна ${ru(num(p, 'S'))}, ` +
      `а боковое ребро равно ${ru(num(p, 'h'))}.`
    );
  },
  dopustimo: (p) => SH(p).every((x) => x > 0) && (num(p, 'mirror') === 0 || num(p, 'mirror') === 1),
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 18;
  },
  poModeli: (p) => volumeOf(p, tetra40Names(p)),
  chertezh: (p) => {
    const names = tetra40Names(p);
    const [a, b, c, d] = names;
    return shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделен тетраэдр ${names.join(', ')}`,
      [
        [a, b],
        [b, c],
        [c, a],
        [d, a],
        [d, b],
        [d, c],
      ],
    );
  },
  shagi: (p) => {
    const [S, h] = SH(p);
    return [
      {
        text: 'Три соседние вершины одного уровня отсекают от основания шестую часть, площадью S/6; четвёртая вершина лежит на высоте h от их плоскости.',
      },
      {
        text: 'Объём тетраэдра — треть произведения площади основания на высоту.',
        formula: `\\dfrac{1}{3} \\cdot \\dfrac{${tex(S)}}{6} \\cdot ${tex(h)} = \\dfrac{${tex(round(S * h))}}{18} = ${tex(round((S * h) / 18))}`,
        value: (S * h) / 18,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 124', { S: 12, h: 15, mirror: 0 }),
    variant(2, 'задачник', 'задачник 125', { S: 9, h: 6, mirror: 1 }),
    variant(3, 'новый', 'новый', { S: 6, h: 15, mirror: 0 }),
    variant(4, 'новый', 'новый', { S: 18, h: 10, mirror: 1 }),
    variant(5, 'новый', 'новый', { S: 24, h: 6, mirror: 0 }),
    variant(6, 'новый', 'новый', { S: 15, h: 12, mirror: 1 }),
    variant(7, 'новый', 'новый', { S: 10, h: 9, mirror: 0 }),
    variant(8, 'новый', 'новый', { S: 9, h: 8, mirror: 1 }),
    variant(9, 'новый', 'новый', { S: 12, h: 9, mirror: 0 }),
    variant(10, 'новый', 'новый', { S: 6, h: 21, mirror: 1 }),
  ],
};
