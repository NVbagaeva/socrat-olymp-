/**
 * Раздел I, прототипы P03-01 … P03-04: диагонали и сечения
 * прямоугольного параллелепипеда.
 *
 * Формулировки взяты из задачника дословно; параметры — числа рёбер
 * и буквы искомой диагонали или сечения. Ответ считается дважды:
 * по формуле прототипа и по координатам той же модели.
 */

import { vertex } from '../../solid/figures';
import { distance, polygonArea, polyhedronVolume } from '../../solid/measure';
import { NAMES, shapeLines, shapeSection } from '../../solid/drawings/section1';
import { letters, ru, segment } from '../format';
import { type Params, type Prototype, type Variant, num, pair, text } from '../types';
import { baseNames, boxOf, coversAllDims, sides } from './common';

/** Три ребра условия строкой: «DD₁=2, C₁D₁=6, B₁C₁=3». */
function edgesText(p: Params): string {
  return [1, 2, 3].map((i) => `${letters(text(p, `n${i}`))}=${ru(num(p, `v${i}`))}`).join(', ');
}

function edgeNames(p: Params): string[] {
  return [text(p, 'n1'), text(p, 'n2'), text(p, 'n3')];
}

function edgeValues(p: Params): number[] {
  return [num(p, 'v1'), num(p, 'v2'), num(p, 'v3')];
}

function boxSides(p: Params): [number, number, number] {
  return sides(edgeNames(p), edgeValues(p));
}

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

/* ── P03-01. Диагональ прямоугольного параллелепипеда ───────────── */

export const P03_01: Prototype = {
  id: 'P03-01',
  razdel: 'I',
  nazvanie: 'Диагональ прямоугольного параллелепипеда',
  tip: 'длина диагонали по трём рёбрам',
  zadachnik: [1, 8],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известно, что ${edgesText(p)}. ` +
    `Найдите длину диагонали ${segment(pair(p, 'diag'))}.`,

  dopustimo: (p) => {
    const [a, b, c] = boxSides(p);
    return coversAllDims(edgeNames(p)) && a > 0 && b > 0 && c > 0;
  },

  otvet: (p) => {
    const [a, b, c] = boxSides(p);
    return Math.sqrt(a * a + b * b + c * c);
  },

  poModeli: (p) => {
    const [a, b, c] = boxSides(p);
    const body = boxOf(a, b, c);
    const [from, to] = pair(p, 'diag');
    return distance(vertex(body, from), vertex(body, to));
  },

  chertezh: (p) => {
    const diag = pair(p, 'diag');
    return shapeLines(
      'box',
      `Прямоугольный параллелепипед ${NAMES} с диагональю ${segment(diag)}`,
      [diag],
    );
  },

  shagi: (p) => {
    const [a, b, c] = boxSides(p);
    const diag = segment(pair(p, 'diag'));
    const base = a * a + b * b;
    return [
      {
        text: `Рёбра параллелепипеда: два лежат в основании, одно вертикальное: ${ru(a)}, ${ru(b)} и ${ru(c)}.`,
      },
      {
        text: `Диагональ основания: её квадрат равен ${ru(a)}² + ${ru(b)}² = ${ru(base)}.`,
        value: base,
      },
      {
        text: `Диагональ ${diag} — гипотенуза прямоугольного треугольника с катетами, равными диагонали основания и вертикальному ребру: ${diag} = √(${ru(base)} + ${ru(c)}²) = ${ru(Math.sqrt(base + c * c))}.`,
        value: Math.sqrt(base + c * c),
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 1', {
      n1: 'DD1',
      v1: 2,
      n2: 'C1D1',
      v2: 6,
      n3: 'B1C1',
      v3: 3,
      diag: ['A', 'C1'],
    }),
    variant(2, 'задачник', 'задачник 2', {
      n1: 'BB1',
      v1: 16,
      n2: 'A1B1',
      v2: 2,
      n3: 'A1D1',
      v3: 8,
      diag: ['A', 'C1'],
    }),
    variant(3, 'задачник', 'задачник 3', {
      n1: 'AA1',
      v1: 10,
      n2: 'AB',
      v2: 5,
      n3: 'A1D1',
      v3: 10,
      diag: ['D', 'B1'],
    }),
    variant(4, 'задачник', 'задачник 4', {
      n1: 'CC1',
      v1: 4,
      n2: 'A1B1',
      v2: 1,
      n3: 'BC',
      v3: 8,
      diag: ['D', 'B1'],
    }),
    variant(5, 'задачник', 'задачник 5', {
      n1: 'AA1',
      v1: 12,
      n2: 'A1B1',
      v2: 12,
      n3: 'B1C1',
      v3: 1,
      diag: ['B', 'D1'],
    }),
    variant(6, 'задачник', 'задачник 6', {
      n1: 'BB1',
      v1: 8,
      n2: 'CD',
      v2: 8,
      n3: 'AD',
      v3: 14,
      diag: ['B', 'D1'],
    }),
    variant(7, 'задачник', 'задачник 7', {
      n1: 'CC1',
      v1: 6,
      n2: 'CD',
      v2: 17,
      n3: 'AD',
      v3: 6,
      diag: ['C', 'A1'],
    }),
    variant(8, 'задачник', 'задачник 8', {
      n1: 'DD1',
      v1: 6,
      n2: 'A1B1',
      v2: 12,
      n3: 'A1D1',
      v3: 12,
      diag: ['C', 'A1'],
    }),
    variant(
      9,
      'домашка',
      'домашка 1, вариант 1',
      { n1: 'CC1', v1: 6, n2: 'A1B1', v2: 3, n3: 'BC', v3: 2, diag: ['D', 'B1'] },
      7,
    ),
    variant(
      10,
      'домашка',
      'домашка 1, вариант 2',
      { n1: 'CC1', v1: 6, n2: 'CD', v2: 6, n3: 'AD', v3: 7, diag: ['C', 'A1'] },
      11,
    ),
  ],
};

/* ── P03-02. Диагональ куба → объём ─────────────────────────────── */

export const P03_02: Prototype = {
  id: 'P03-02',
  razdel: 'I',
  nazvanie: 'Диагональ куба → объём',
  tip: 'объём куба по его диагонали',
  zadachnik: [9, 12],
  status: 'есть',
  format: 'целое',

  uslovie: (p) => {
    const k = num(p, 'k');
    return `Диагональ куба равна $\\sqrt{${3 * k * k}}$. Найдите его объём.`;
  },

  dopustimo: (p) => num(p, 'k') > 0 && Number.isInteger(num(p, 'k')),

  otvet: (p) => {
    const d = Math.sqrt(3 * num(p, 'k') * num(p, 'k'));
    /* Ребро куба из диагонали: d = a√3. */
    const a = d / Math.sqrt(3);
    return a * a * a;
  },

  poModeli: (p) => {
    const d = Math.sqrt(3 * num(p, 'k') * num(p, 'k'));
    const a = d / Math.sqrt(3);
    const body = boxOf(a, a, a);
    /* Объём считается по граням модели, а не перемножением рёбер. */
    return polyhedronVolume(body);
  },

  chertezh: () => shapeLines('cube', 'Куб с диагональю', [['A', 'C1']], { letters: false }),

  shagi: (p) => {
    const k = num(p, 'k');
    const d2 = 3 * k * k;
    return [
      { text: `Диагональ куба с ребром a равна a√3, значит a√3 = √${ru(d2)}.` },
      { text: `Отсюда a = √${ru(d2)} / √3 = ${ru(k)}.`, value: k },
      { text: `Объём куба: a³ = ${ru(k)}³ = ${ru(k * k * k)}.`, value: k * k * k },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 9', { k: 2 }),
    variant(2, 'домашка', 'домашка 2, вариант 2', { k: 1 }, 1),
    variant(3, 'домашка', 'домашка 2, вариант 3', { k: 4 }, 64),
    variant(4, 'домашка', 'домашка 2, вариант 4', { k: 6 }, 216),
    variant(5, 'новый', 'новый', { k: 3 }),
    variant(6, 'новый', 'новый', { k: 5 }),
    variant(7, 'новый', 'новый', { k: 7 }),
    variant(8, 'новый', 'новый', { k: 8 }),
    variant(9, 'новый', 'новый', { k: 9 }),
    variant(10, 'новый', 'новый', { k: 10 }),
  ],
};

/* ── P03-03. Сечение через A, B, C₁ ─────────────────────────────── */

export const P03_03: Prototype = {
  id: 'P03-03',
  razdel: 'I',
  nazvanie: 'Сечение через A, B, C₁',
  tip: 'площадь сечения — прямоугольника ABC₁D₁',
  zadachnik: [13, 14],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известны длины рёбер: ` +
    `AB=${ru(num(p, 'a'))}, AD=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. ` +
    'Найдите площадь сечения параллелепипеда плоскостью, проходящей через точки A, B и C₁.',

  dopustimo: (p) => num(p, 'a') > 0 && num(p, 'b') > 0 && num(p, 'c') > 0,

  otvet: (p) => num(p, 'a') * Math.hypot(num(p, 'b'), num(p, 'c')),

  poModeli: (p) => {
    const body = boxOf(num(p, 'a'), num(p, 'b'), num(p, 'c'));
    return polygonArea(['A', 'B', 'C1', 'D1'].map((name) => vertex(body, name)));
  },

  chertezh: () =>
    shapeSection(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, сечение через точки A, B и C₁ — прямоугольник ABC₁D₁`,
      ['A', 'B', 'C1', 'D1'],
    ),

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const side = Math.hypot(b, c);
    return [
      { text: 'Сечение через A, B и C₁ — прямоугольник ABC₁D₁: AB параллельно D₁C₁.' },
      {
        text: `Вторая сторона BC₁ — диагональ боковой грани: BC₁ = √(${ru(b)}² + ${ru(c)}²) = ${ru(side)}.`,
        value: side,
      },
      {
        text: `Площадь: AB · BC₁ = ${ru(a)} · ${ru(side)} = ${ru(a * side)}.`,
        value: a * side,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 13', { a: 7, b: 3, c: 4 }),
    variant(2, 'задачник', 'задачник 14', { a: 11, b: 6, c: 8 }),
    variant(3, 'домашка', 'домашка 3, вариант 1', { a: 9, b: 9, c: 12 }, 135),
    variant(4, 'домашка', 'домашка 3, вариант 2', { a: 4, b: 4, c: 3 }, 20),
    variant(5, 'домашка', 'домашка 3, вариант 3', { a: 2, b: 24, c: 7 }, 50),
    variant(6, 'домашка', 'домашка 3, вариант 4', { a: 6, b: 3, c: 4 }, 30),
    variant(7, 'новый', 'новый', { a: 3, b: 12, c: 9 }),
    variant(8, 'новый', 'новый', { a: 8, b: 5, c: 12 }),
    variant(9, 'новый', 'новый', { a: 5, b: 15, c: 20 }),
    variant(10, 'новый', 'новый', { a: 10, b: 12, c: 16 }),
  ],
};

/* ── P03-04. Диагональное сечение через боковое ребро ───────────── */

/** Четыре вершины сечения по трём точкам условия: A, A₁, C → A, C, C₁, A₁. */
function sectionQuad(points: readonly string[]): [string, string, string, string] {
  const [x, y] = baseNames(points);
  if (x === undefined || y === undefined) {
    throw new Error('В сечении должно быть две нижние вершины');
  }
  return [x, y, `${y}1`, `${x}1`];
}

export const P03_04: Prototype = {
  id: 'P03-04',
  razdel: 'I',
  nazvanie: 'Диагональное сечение через боковое ребро',
  tip: 'площадь диагонального сечения',
  zadachnik: [15, 18],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) => {
    const names = [text(p, 'p1'), text(p, 'p2'), text(p, 'p3')].map(letters);
    return (
      `В прямоугольном параллелепипеде ${NAMES} известны длины рёбер: ` +
      `AB=${ru(num(p, 'a'))}, AD=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. ` +
      `Найдите площадь сечения, проходящего через вершины ${names[0]}, ${names[1]} и ${names[2]}.`
    );
  },

  dopustimo: (p) => {
    const points = [text(p, 'p1'), text(p, 'p2'), text(p, 'p3')];
    return (
      num(p, 'a') > 0 &&
      num(p, 'b') > 0 &&
      num(p, 'c') > 0 &&
      baseNames(points).length === 2 &&
      points.length === 3
    );
  },

  otvet: (p) => num(p, 'c') * Math.hypot(num(p, 'a'), num(p, 'b')),

  poModeli: (p) => {
    const body = boxOf(num(p, 'a'), num(p, 'b'), num(p, 'c'));
    const quad = sectionQuad([text(p, 'p1'), text(p, 'p2'), text(p, 'p3')]);
    return polygonArea(quad.map((name) => vertex(body, name)));
  },

  chertezh: (p) => {
    const quad = sectionQuad([text(p, 'p1'), text(p, 'p2'), text(p, 'p3')]);
    const name = quad.map(letters).join('');
    return shapeSection(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, диагональное сечение ${name}`,
      quad,
    );
  },

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const diag = Math.hypot(a, b);
    const quad = sectionQuad([text(p, 'p1'), text(p, 'p2'), text(p, 'p3')]);
    return [
      {
        text: `Сечение ${quad.map(letters).join('')} — прямоугольник: одна сторона — диагональ основания, другая — боковое ребро.`,
      },
      {
        text: `Диагональ основания: √(${ru(a)}² + ${ru(b)}²) = ${ru(diag)}.`,
        value: diag,
      },
      {
        text: `Площадь: ${ru(diag)} · ${ru(c)} = ${ru(diag * c)}.`,
        value: diag * c,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 15', { a: 21, b: 20, c: 23, p1: 'A', p2: 'A1', p3: 'C' }),
    variant(2, 'задачник', 'задачник 16', { a: 3, b: 4, c: 32, p1: 'C', p2: 'C1', p3: 'A' }),
    variant(3, 'задачник', 'задачник 17', { a: 27, b: 36, c: 10, p1: 'D', p2: 'D1', p3: 'B' }),
    variant(4, 'задачник', 'задачник 18', { a: 15, b: 8, c: 21, p1: 'B', p2: 'B1', p3: 'D' }),
    variant(5, 'новый', 'новый', { a: 7, b: 24, c: 5, p1: 'A', p2: 'A1', p3: 'C' }),
    variant(6, 'новый', 'новый', { a: 9, b: 12, c: 8, p1: 'C', p2: 'C1', p3: 'A' }),
    variant(7, 'новый', 'новый', { a: 12, b: 5, c: 11, p1: 'D', p2: 'D1', p3: 'B' }),
    variant(8, 'новый', 'новый', { a: 6, b: 8, c: 14, p1: 'B', p2: 'B1', p3: 'D' }),
    variant(9, 'новый', 'новый', { a: 16, b: 30, c: 4, p1: 'A', p2: 'A1', p3: 'C' }),
    variant(10, 'новый', 'новый', { a: 20, b: 21, c: 6, p1: 'C', p2: 'C1', p3: 'A' }),
  ],
};
