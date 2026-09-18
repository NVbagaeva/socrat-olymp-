/**
 * Раздел II, прототипы P03-28…34: часть правильной треугольной
 * призмы — пирамида или тетраэдр, заданные перечнем вершин.
 *
 * Формула прототипа выведена через координаты (в шагах разбора —
 * то же рассуждение словами), а независимая проверка считает объём
 * выпуклой оболочки тех же вершин по правильной призме с площадью
 * основания S и боковым ребром h — двумя разными путями к одному
 * числу.
 */

import { vertex } from '../../solid/figures';
import { hullVolume } from '../../solid/measure';
import { regularPrismByArea } from './common';
import { shapeTriSolid, TRI_FIGURA, TRI_NAMES } from './drawings';
import { chislo, formula, imya, letters, texChislo } from '../format';
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
  const body = regularPrismByArea(3, S, h);
  return hullVolume(names.map((name) => vertex(body, name)));
}

/** Условие «найдите объём многогранника с вершинами …, у призмы …». */
function findVolumeOf(p: Params, names: readonly string[], wordVertices: string): string {
  const [S, h] = SH(p);
  return (
    `Найдите объём многогранника, вершинами которого являются ${wordVertices} ` +
    `${names.map(imya).join(', ')} правильной треугольной призмы ${imya(TRI_FIGURA)}, ` +
    `площадь основания которой равна ${chislo(S)}, а боковое ребро равно ${chislo(h)}.`
  );
}

/* ── P03-28. Пирамида A, B, C, C₁ ────────────────────────────────── */

export const P03_28: Prototype = {
  id: 'P03-28',
  razdel: 'II',
  nazvanie: 'Пирамида A, B, C, C₁ в правильной треугольной призме',
  tip: 'объём пирамиды: основание призмы, вершина — соседняя верхняя',
  zadachnik: [94, 95],
  status: 'есть',
  format: 'целое',
  uslovie: (p) => findVolumeOf(p, ['A', 'B', 'C', 'C1'], 'вершины'),
  dopustimo: (p) => SH(p).every((x) => x > 0),
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 3;
  },
  poModeli: (p) => volumeOf(p, ['A', 'B', 'C', 'C1']),
  chertezh: () =>
    shapeTriSolid(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, B, C, C₁`,
      [
        ['A', 'C1'],
        ['B', 'C1'],
      ],
    ),
  shagi: (p) => {
    const [S, h] = SH(p);
    return [
      {
        text:
          `Это пирамида с основанием ${imya('ABC')} (площадь ${imya('S')}) и вершиной ` +
          `${imya('C1')}; её высота — боковое ребро ${imya('h')}, потому что ` +
          `${imya('C1')} лежит прямо над ${imya('C')}.`,
      },
      {
        text: `Объём: ${formula(`${texChislo(S)} \\cdot ${texChislo(h)} : 3 = ${texChislo((S * h) / 3)}`)}.`,
        value: (S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 94', { S: 6, h: 9 }),
    variant(2, 'задачник', 'задачник 95', { S: 7, h: 9 }),
    variant(3, 'домашка', 'домашка 19, вариант 4', { S: 7, h: 12 }, 28),
    variant(4, 'новый', 'новый', { S: 8, h: 6 }),
    variant(5, 'новый', 'новый', { S: 9, h: 6 }),
    variant(6, 'новый', 'новый', { S: 4, h: 12 }),
    variant(7, 'новый', 'новый', { S: 8, h: 9 }),
    variant(8, 'новый', 'новый', { S: 5, h: 6 }),
    variant(9, 'новый', 'новый', { S: 12, h: 5 }),
    variant(10, 'новый', 'новый', { S: 10, h: 3 }),
  ],
};

/* ── P03-29. Пирамида A, B, C, A₁ (или B₁) ───────────────────────── */

export const P03_29: Prototype = {
  id: 'P03-29',
  razdel: 'II',
  nazvanie: 'Пирамида A, B, C, A₁ (B₁) в правильной треугольной призме',
  tip: 'объём пирамиды: основание призмы, вершина — соседняя верхняя',
  zadachnik: [96, 97],
  status: 'добавить',
  format: 'целое',
  uslovie: (p) => findVolumeOf(p, ['A', 'B', 'C', num(p, 'apex') === 1 ? 'A1' : 'B1'], 'точки'),
  dopustimo: (p) => SH(p).every((x) => x > 0) && (num(p, 'apex') === 1 || num(p, 'apex') === 2),
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 3;
  },
  poModeli: (p) => volumeOf(p, ['A', 'B', 'C', num(p, 'apex') === 1 ? 'A1' : 'B1']),
  chertezh: (p) => {
    const apex = num(p, 'apex') === 1 ? 'A1' : 'B1';
    const others = apex === 'A1' ? ['B', 'C'] : ['A', 'C'];
    return shapeTriSolid(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, B, C, ${apex.replace('1', '₁')}`,
      [
        [others[0] as string, apex],
        [others[1] as string, apex],
      ],
    );
  },
  shagi: (p) => {
    const [S, h] = SH(p);
    const apex = num(p, 'apex') === 1 ? 'A1' : 'B1';
    return [
      {
        text:
          `Это пирамида с основанием ${imya('ABC')} (площадь ${imya('S')}) и вершиной ` +
          `${imya(apex)}; высота — боковое ребро ${imya('h')}.`,
      },
      {
        text: `Объём: ${formula(`${texChislo(S)} \\cdot ${texChislo(h)} : 3 = ${texChislo((S * h) / 3)}`)}.`,
        value: (S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 96', { S: 5, h: 6, apex: 1 }),
    variant(2, 'задачник', 'задачник 97', { S: 7, h: 3, apex: 2 }),
    variant(3, 'новый', 'новый', { S: 9, h: 4, apex: 1 }),
    variant(4, 'новый', 'новый', { S: 6, h: 5, apex: 2 }),
    variant(5, 'новый', 'новый', { S: 8, h: 3, apex: 1 }),
    variant(6, 'новый', 'новый', { S: 4, h: 9, apex: 2 }),
    variant(7, 'новый', 'новый', { S: 10, h: 3, apex: 1 }),
    variant(8, 'новый', 'новый', { S: 3, h: 8, apex: 2 }),
    variant(9, 'новый', 'новый', { S: 12, h: 4, apex: 1 }),
    variant(10, 'новый', 'новый', { S: 5, h: 12, apex: 2 }),
  ],
};

/* ── P03-30. Пирамида с основанием A₁B₁C₁ и вершиной внизу ──────── */

const BOTTOM_APEX = ['A', 'B', 'C'] as const;

export const P03_30: Prototype = {
  id: 'P03-30',
  razdel: 'II',
  nazvanie: 'Пирамида с основанием A₁B₁C₁ и вершиной внизу',
  tip: 'объём пирамиды: основание — верх призмы, вершина — соседняя нижняя',
  zadachnik: [98, 101],
  status: 'добавить',
  format: 'целое',
  uslovie: (p) => {
    const apex = BOTTOM_APEX[num(p, 'apex') % 3] as string;
    return findVolumeOf(p, [apex, 'A1', 'B1', 'C1'], 'точки');
  },
  dopustimo: (p) => SH(p).every((x) => x > 0) && num(p, 'apex') >= 0 && num(p, 'apex') <= 2,
  otvet: (p) => {
    const [S, h] = SH(p);
    return (S * h) / 3;
  },
  poModeli: (p) => {
    const apex = BOTTOM_APEX[num(p, 'apex') % 3] as string;
    return volumeOf(p, [apex, 'A1', 'B1', 'C1']);
  },
  chertezh: (p) => {
    const apex = BOTTOM_APEX[num(p, 'apex') % 3] as string;
    return shapeTriSolid(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с основанием A₁B₁C₁ и вершиной ${apex}`,
      [
        [apex, 'A1'],
        [apex, 'B1'],
        [apex, 'C1'],
      ],
    );
  },
  shagi: (p) => {
    const [S, h] = SH(p);
    const apex = BOTTOM_APEX[num(p, 'apex') % 3] as string;
    return [
      {
        text:
          `Это пирамида с основанием ${imya('A1B1C1')} (площадь ${imya('S')}) и вершиной ` +
          `${imya(apex)}; высота — боковое ребро ${imya('h')}.`,
      },
      {
        text: `Объём: ${formula(`${texChislo(S)} \\cdot ${texChislo(h)} : 3 = ${texChislo((S * h) / 3)}`)}.`,
        value: (S * h) / 3,
      },
    ];
  },
  varianty: [
    variant(1, 'задачник', 'задачник 98', { S: 2, h: 6, apex: 0 }),
    variant(2, 'задачник', 'задачник 99', { S: 3, h: 2, apex: 0 }),
    variant(3, 'задачник', 'задачник 100', { S: 9, h: 4, apex: 2 }),
    variant(4, 'задачник', 'задачник 101', { S: 9, h: 8, apex: 1 }),
    variant(5, 'новый', 'новый', { S: 6, h: 9, apex: 0 }),
    variant(6, 'новый', 'новый', { S: 12, h: 5, apex: 1 }),
    variant(7, 'новый', 'новый', { S: 4, h: 12, apex: 2 }),
    variant(8, 'новый', 'новый', { S: 5, h: 6, apex: 0 }),
    variant(9, 'новый', 'новый', { S: 8, h: 3, apex: 1 }),
    variant(10, 'новый', 'новый', { S: 10, h: 3, apex: 2 }),
  ],
};

/* ── P03-31/32. Многогранник из пяти вершин (без одной нижней) ──── */

function fiveVertexProto(
  id: string,
  nazvanie: string,
  zad: [number, number],
  status: 'есть' | 'добавить',
  missing: 'B' | 'A',
  varianty: readonly Variant[],
): Prototype {
  const names = missing === 'B' ? ['A', 'C', 'A1', 'B1', 'C1'] : ['B', 'C', 'A1', 'B1', 'C1'];
  return {
    id,
    razdel: 'II',
    nazvanie,
    tip: 'объём призмы без одной пирамиды у основания — две трети полного',
    zadachnik: zad,
    status,
    format: 'целое',
    uslovie: (p) =>
      `Дана правильная треугольная призма ${imya(TRI_FIGURA)}, площадь основания которой ` +
      `равна ${chislo(num(p, 'S'))}, а боковое ребро равно ${chislo(num(p, 'h'))}. ` +
      'Найдите объём многогранника, вершинами которого являются точки ' +
      `${names.map(imya).join(', ')}.`,
    dopustimo: (p) => SH(p).every((x) => x > 0),
    otvet: (p) => {
      const [S, h] = SH(p);
      return (2 * S * h) / 3;
    },
    poModeli: (p) => volumeOf(p, names),
    chertezh: () =>
      shapeTriSolid(
        `Правильная треугольная призма ${TRI_NAMES}, выделен многогранник с вершинами ${names.map(letters).join(', ')}`,
        [
          [names[0] as string, names[1] as string],
          [names[0] as string, 'B1'],
          [names[1] as string, missing === 'B' ? 'A1' : 'C1'],
        ],
      ),
    shagi: (p) => {
      const [S, h] = SH(p);
      const missingName = missing === 'B' ? 'B' : 'A';
      return [
        {
          text:
            `Это призма без пирамиды с вершиной ${imya(missingName)}: у той пирамиды ` +
            'основание — половина боковой грани, а объём — треть призмы.',
        },
        {
          text: `Объём фигуры: ${formula(`${texChislo(S)} \\cdot ${texChislo(h)} \\cdot \\tfrac{2}{3} = ${texChislo((2 * S * h) / 3)}`)}.`,
          value: (2 * S * h) / 3,
        },
      ];
    },
    varianty,
  };
}

export const P03_31 = fiveVertexProto(
  'P03-31',
  'Многогранник A, C, A₁, B₁, C₁',
  [102, 103],
  'есть',
  'B',
  [
    variant(1, 'задачник', 'задачник 102', { S: 8, h: 6 }),
    variant(2, 'задачник', 'задачник 103', { S: 7, h: 9 }),
    variant(3, 'новый', 'новый', { S: 9, h: 6 }),
    variant(4, 'новый', 'новый', { S: 6, h: 12 }),
    variant(5, 'новый', 'новый', { S: 5, h: 9 }),
    variant(6, 'новый', 'новый', { S: 12, h: 9 }),
    variant(7, 'новый', 'новый', { S: 4, h: 12 }),
    variant(8, 'новый', 'новый', { S: 10, h: 3 }),
    variant(9, 'новый', 'новый', { S: 3, h: 8 }),
    variant(10, 'новый', 'новый', { S: 15, h: 4 }),
  ],
);

export const P03_32 = fiveVertexProto(
  'P03-32',
  'Многогранник B, C, A₁, B₁, C₁',
  [104, 105],
  'добавить',
  'A',
  [
    variant(1, 'задачник', 'задачник 104', { S: 4, h: 6 }),
    variant(2, 'задачник', 'задачник 105', { S: 9, h: 5 }),
    variant(3, 'новый', 'новый', { S: 6, h: 9 }),
    variant(4, 'новый', 'новый', { S: 12, h: 4 }),
    variant(5, 'новый', 'новый', { S: 3, h: 10 }),
    variant(6, 'новый', 'новый', { S: 8, h: 6 }),
    variant(7, 'новый', 'новый', { S: 5, h: 12 }),
    variant(8, 'новый', 'новый', { S: 9, h: 4 }),
    variant(9, 'новый', 'новый', { S: 6, h: 5 }),
    variant(10, 'новый', 'новый', { S: 15, h: 3 }),
  ],
);

/* ── P03-33/34. Тетраэдр из четырёх вершин по диагонали ─────────── */

function tetraProto(
  id: string,
  nazvanie: string,
  zad: [number, number],
  names: readonly [string, string, string, string],
  edges: readonly (readonly [string, string])[],
  varianty: readonly Variant[],
): Prototype {
  return {
    id,
    razdel: 'II',
    nazvanie,
    tip: 'объём тетраэдра из противолежащих вершин призмы',
    zadachnik: zad,
    status: 'добавить',
    format: 'целое',
    uslovie: (p) =>
      'Найдите объём многогранника, вершинами которого являются вершины ' +
      `${names.map(imya).join(', ')} правильной треугольной призмы ${imya(TRI_FIGURA)}. ` +
      `Площадь основания призмы равна ${chislo(num(p, 'S'))}, ` +
      `а боковое ребро равно ${chislo(num(p, 'h'))}.`,
    dopustimo: (p) => SH(p).every((x) => x > 0),
    otvet: (p) => {
      const [S, h] = SH(p);
      return (S * h) / 3;
    },
    poModeli: (p) => volumeOf(p, names),
    chertezh: () =>
      shapeTriSolid(
        `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами ${names.map(letters).join(', ')}`,
        edges,
      ),
    shagi: (p) => {
      const [S, h] = SH(p);
      return [
        {
          text: 'Такой тетраэдр — одна из трёх равных частей, на которые призма делится диагональными сечениями: его объём — треть объёма призмы.',
        },
        {
          text: `Объём: ${formula(`${texChislo(S)} \\cdot ${texChislo(h)} : 3 = ${texChislo((S * h) / 3)}`)}.`,
          value: (S * h) / 3,
        },
      ];
    },
    varianty,
  };
}

export const P03_33 = tetraProto(
  'P03-33',
  'Пирамида A, C, A₁, B₁',
  [106, 107],
  ['A', 'C', 'A1', 'B1'],
  [
    ['A', 'C'],
    ['A', 'B1'],
    ['C', 'A1'],
    ['C', 'B1'],
    ['A1', 'B1'],
  ],
  [
    variant(1, 'задачник', 'задачник 106', { S: 9, h: 4 }),
    variant(2, 'задачник', 'задачник 107', { S: 8, h: 6 }),
    variant(3, 'новый', 'новый', { S: 6, h: 9 }),
    variant(4, 'новый', 'новый', { S: 12, h: 3 }),
    variant(5, 'новый', 'новый', { S: 5, h: 12 }),
    variant(6, 'новый', 'новый', { S: 10, h: 6 }),
    variant(7, 'новый', 'новый', { S: 4, h: 9 }),
    variant(8, 'новый', 'новый', { S: 15, h: 4 }),
    variant(9, 'новый', 'новый', { S: 3, h: 8 }),
    variant(10, 'новый', 'новый', { S: 7, h: 12 }),
  ],
);

export const P03_34 = tetraProto(
  'P03-34',
  'Пирамида A, C, B₁, C₁',
  [108, 109],
  ['A', 'C', 'B1', 'C1'],
  [
    ['A', 'C'],
    ['A', 'B1'],
    ['A', 'C1'],
    ['C', 'B1'],
    ['B1', 'C1'],
  ],
  [
    variant(1, 'задачник', 'задачник 108', { S: 3, h: 5 }),
    variant(2, 'задачник', 'задачник 109', { S: 7, h: 9 }),
    variant(3, 'новый', 'новый', { S: 6, h: 4 }),
    variant(4, 'новый', 'новый', { S: 9, h: 8 }),
    variant(5, 'новый', 'новый', { S: 4, h: 6 }),
    variant(6, 'новый', 'новый', { S: 12, h: 5 }),
    variant(7, 'новый', 'новый', { S: 5, h: 9 }),
    variant(8, 'новый', 'новый', { S: 10, h: 3 }),
    variant(9, 'новый', 'новый', { S: 8, h: 6 }),
    variant(10, 'новый', 'новый', { S: 15, h: 2 }),
  ],
);
