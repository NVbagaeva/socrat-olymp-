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
import { chislo, formula, imya, letters, otr, ravno, segment, tex, texChislo } from '../format';
import { type Zadacha, chertezhRazbora, chertezhUslovia } from '../zadacha';
import { type Params, type Prototype, type Variant, num, pair, text } from '../types';
import { baseNames, boxOf, coversAllDims, sides } from './common';
import { solveBySearch } from '../search';

/** Имя фигуры без индексов: из него собирается и текст, и структура. */
const FIGURA = 'ABCDA1B1C1D1';

/** Ребро по имени: 'DD1' → ['D', 'D1']. */
function vershinyRebra(name: string): readonly [string, string] {
  const parts = name.match(/[A-Z]\d?/g) ?? [];
  const [a, b] = parts;
  if (a === undefined || b === undefined) {
    throw new Error(`Ребро ${name} — не пара вершин`);
  }
  return [a, b];
}

/** Три ребра условия формулами: «$DD_1 = 2$, $C_1D_1 = 6$, $B_1C_1 = 3$». */
function edgesText(p: Params): string {
  return [1, 2, 3].map((i) => ravno(vershinyRebra(text(p, `n${i}`)), num(p, `v${i}`))).join(', ');
}

/**
 * Вершина того же основания, что и from, под концом диагонали:
 * A и C₁ → C. Через неё в разборе проходит диагональ основания.
 */
function podNogami(from: string, to: string): string {
  const base = to.replace(/\d/g, '');
  return from.includes('1') ? `${base}1` : base;
}

/** Структура варианта P03-01: три ребра даны, диагональ ищут. */
function zadachaDiagonali(p: Params): Zadacha {
  const diag = pair(p, 'diag');
  const corner = podNogami(diag[0], diag[1]);
  return {
    telo: 'box',
    imya: FIGURA,
    iskomoe: 'длина диагонали',
    elementy: [
      ...[1, 2, 3].map((i) => {
        const [ot, to] = vershinyRebra(text(p, `n${i}`));
        return {
          vid: 'отрезок' as const,
          ot,
          do: to,
          rol: 'дано' as const,
          dlina: num(p, `v${i}`),
        };
      }),
      { vid: 'отрезок', ot: diag[0], do: diag[1], rol: 'искомое' },
      /* Разбор: диагональ основания и вертикальное ребро — катеты
         того самого прямоугольного треугольника. */
      { vid: 'отрезок', ot: diag[0], do: corner, rol: 'построение' },
      { vid: 'отрезок', ot: corner, do: diag[1], rol: 'построение' },
    ],
  };
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
    `В прямоугольном параллелепипеде ${imya(FIGURA)} известно, что ${edgesText(p)}. ` +
    `Найдите длину диагонали ${otr(pair(p, 'diag'))}.`,

  zadacha: zadachaDiagonali,

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

  chertezh: (p) =>
    chertezhUslovia(
      zadachaDiagonali(p),
      `Прямоугольный параллелепипед ${NAMES}, выделена диагональ ${segment(pair(p, 'diag'))}`,
    ),

  chertezhRazbora: (p) => {
    const diag = pair(p, 'diag');
    const corner = podNogami(diag[0], diag[1]);
    return chertezhRazbora(
      zadachaDiagonali(p),
      `Тот же параллелепипед: к диагонали ${segment(diag)} проведены диагональ основания ` +
        `${segment([diag[0], corner])} и ребро ${segment([corner, diag[1]])}`,
    );
  },

  shagi: (p) => {
    const [a, b, c] = boxSides(p);
    const diag = pair(p, 'diag');
    const corner = podNogami(diag[0], diag[1]);
    const base = a * a + b * b;
    const answer = Math.sqrt(base + c * c);
    /* Записи TeX собираются из имён вершин, а не пишутся строкой:
       источник у них тот же, что у чертежа. */
    const osnovanie = tex(diag[0] + corner);
    const rebro = tex(corner + diag[1]);
    const iskomaya = tex(diag[0] + diag[1]);
    return [
      {
        text:
          'Рёбра параллелепипеда: два лежат в основании, одно вертикальное — ' +
          `${chislo(a)}, ${chislo(b)} и ${chislo(c)}.`,
      },
      {
        text:
          `Проведём диагональ основания ${otr([diag[0], corner])}. По теореме Пифагора ` +
          `${formula(`${osnovanie}^2 = ${texChislo(a)}^2 + ${texChislo(b)}^2 = ${texChislo(base)}`)}.`,
        value: base,
      },
      {
        text:
          `Ребро ${otr([corner, diag[1]])} перпендикулярно основанию, поэтому треугольник ` +
          `${imya(diag[0] + corner + diag[1])} прямоугольный, и ` +
          `${formula(`${iskomaya} = \\sqrt{${osnovanie}^2 + ${rebro}^2} = \\sqrt{${texChislo(base)} + ${texChislo(c)}^2} = ${texChislo(answer)}`)}.`,
        value: answer,
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
    /* Ребро подбирается так, чтобы настоящая диагональ куба стала равна
       данной, — без деления на √3; объём считается по граням модели. */
    const a = solveBySearch(d, (x) => {
      const cube = boxOf(x, x, x);
      return distance(vertex(cube, 'A'), vertex(cube, 'C1'));
    });
    return polyhedronVolume(boxOf(a, a, a));
  },

  chertezh: () => shapeLines('cube', 'Куб с диагональю', [['A', 'C1']], { letters: false }),

  shagi: (p) => {
    const k = num(p, 'k');
    const d2 = 3 * k * k;
    return [
      {
        text:
          `Диагональ куба с ребром ${imya('a')} равна ${formula('a\\sqrt{3}')}, значит ` +
          `${formula(`a\\sqrt{3} = \\sqrt{${texChislo(d2)}}`)}.`,
      },
      {
        text: `Отсюда ${formula(`a = \\dfrac{\\sqrt{${texChislo(d2)}}}{\\sqrt{3}} = ${texChislo(k)}`)}.`,
        value: k,
      },
      {
        text: `Объём куба: ${formula(`a^3 = ${texChislo(k)}^3 = ${texChislo(k * k * k)}`)}.`,
        value: k * k * k,
      },
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
    `В прямоугольном параллелепипеде ${imya(FIGURA)} известны длины рёбер: ` +
    `${ravno(['A', 'B'], num(p, 'a'))}, ${ravno(['A', 'D'], num(p, 'b'))}, ` +
    `${ravno(['A', 'A1'], num(p, 'c'))}. Найдите площадь сечения параллелепипеда ` +
    `плоскостью, проходящей через точки ${imya('A')}, ${imya('B')} и ${imya('C1')}.`,

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
      {
        text:
          `Сечение через ${imya('A')}, ${imya('B')} и ${imya('C1')} — прямоугольник ` +
          `${imya('ABC1D1')}: ${imya('AB')} параллельно ${imya('D1C1')}.`,
      },
      {
        text:
          `Вторая сторона ${imya('BC1')} — диагональ боковой грани: ` +
          `${formula(`BC_1 = \\sqrt{${texChislo(b)}^2 + ${texChislo(c)}^2} = ${texChislo(side)}`)}.`,
        value: side,
      },
      {
        text: `Площадь: ${formula(`AB \\cdot BC_1 = ${texChislo(a)} \\cdot ${texChislo(side)} = ${texChislo(a * side)}`)}.`,
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
    const names = [text(p, 'p1'), text(p, 'p2'), text(p, 'p3')].map(imya);
    return (
      `В прямоугольном параллелепипеде ${imya(FIGURA)} известны длины рёбер: ` +
      `${ravno(['A', 'B'], num(p, 'a'))}, ${ravno(['A', 'D'], num(p, 'b'))}, ` +
      `${ravno(['A', 'A1'], num(p, 'c'))}. ` +
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
        text:
          `Сечение ${imya(quad.join(''))} — прямоугольник: одна сторона — диагональ ` +
          'основания, другая — боковое ребро.',
      },
      {
        text: `Диагональ основания: ${formula(`\\sqrt{${texChislo(a)}^2 + ${texChislo(b)}^2} = ${texChislo(diag)}`)}.`,
        value: diag,
      },
      {
        text: `Площадь: ${formula(`${texChislo(diag)} \\cdot ${texChislo(c)} = ${texChislo(diag * c)}`)}.`,
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
