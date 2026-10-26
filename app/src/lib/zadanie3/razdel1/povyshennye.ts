/**
 * Раздел I для «Вариантов повышенной сложности»: части прямоугольного
 * параллелепипеда той же формы, что P03-18 и P03-19, но с размерами
 * AB, AD, AA₁ из условия варианта. В список прототипов раздела
 * (тренажёр, банк, «Собрать вариант») не входят — их берёт только
 * раздел вариантов.
 *
 * Проверка формулу не повторяет: объём выпуклой оболочки вершин,
 * перечисленных в условии, меряется по координатам.
 */

import { vertex } from '../../solid/figures';
import { hullVolume } from '../../solid/measure';
import { NAMES, shapeLines } from '../../solid/drawings/section1';
import { letters, ru } from '../format';
import { type Params, type Prototype, num } from '../types';
import { boxOf } from './common';

function abc(p: Params): [number, number, number] {
  return [num(p, 'a'), num(p, 'b'), num(p, 'c')];
}

const SVOI = {
  razdel: 'I',
  status: 'добавить',
  format: 'десятичная',
  dopustimo: (p: Params) => abc(p).every((x) => x > 0),
  varianty: [],
} as const;

function uslovie(p: Params, names: readonly string[]): string {
  const [a, b, c] = abc(p);
  return (
    `Найдите объём многогранника, вершинами которого являются точки ` +
    `$${names.map(letters).join(', ')}$ прямоугольного параллелепипеда $${NAMES}$, у которого ` +
    `$AB=${ru(a)}$, $AD=${ru(b)}$, $AA_1=${ru(c)}$.`
  );
}

function partVolume(p: Params, names: readonly string[]): number {
  const [a, b, c] = abc(p);
  const body = boxOf(a, b, c);
  return hullVolume(names.map((name) => vertex(body, name)));
}

/* ── Пирамида C·ABB₁A₁: точки A, B, C, A₁, B₁ ──────────────────── */

const PIRAMIDA = ['A', 'B', 'C', 'A1', 'B1'];

export const PV03_PIRAMIDA_ABCA1B1: Prototype = {
  ...SVOI,
  id: 'PV03-abca1b1',
  /* Номера задачника — у прототипа банка той же формы (P03-18). */
  zadachnik: [58, 61],
  nazvanie: 'Многогранник $A$, $B$, $C$, $A_1$, $B_1$ в прямоугольном параллелепипеде',
  tip: 'объём четырёхугольной пирамиды внутри параллелепипеда',
  uslovie: (p) => uslovie(p, PIRAMIDA),
  otvet: (p) => abc(p).reduce((x, y) => x * y) / 3,
  poModeli: (p) => partVolume(p, PIRAMIDA),
  chertezh: () =>
    shapeLines('box', `Прямоугольный параллелепипед ${NAMES}, выделена пирамида C·ABB₁A₁`, [
      ['C', 'A'],
      ['C', 'A1'],
      ['C', 'B1'],
    ]),
  shagi: (p) => {
    const [a, b, c] = abc(p);
    return [
      {
        text: 'Точки $A$, $B$, $B_1$, $A_1$ — вершины боковой грани, точка $C$ лежит вне её. Многогранник — четырёхугольная пирамида $CABB_1A_1$ с основанием $ABB_1A_1$ и высотой $BC$: ребро $BC$ перпендикулярно грани $ABB_1A_1$.',
      },
      {
        text: `Площадь основания: $AB\\cdot AA_1 = ${ru(a)} \\cdot ${ru(c)} = ${ru(a * c)}$, высота $BC = AD = ${ru(b)}$.`,
        value: a * c,
      },
      {
        text: `Объём: $\\dfrac13\\cdot ${ru(a * c)} \\cdot ${ru(b)} = ${ru((a * b * c) / 3)}$ — треть параллелепипеда.`,
        value: (a * b * c) / 3,
      },
    ];
  },
};

/* ── Тетраэдр A, B, C, B₁ ───────────────────────────────────────── */

const TETRAEDR = ['A', 'B', 'C', 'B1'];

export const PV03_TETRAEDR_ABCB1: Prototype = {
  ...SVOI,
  id: 'PV03-abcb1',
  /* Номера задачника — у прототипа банка той же формы (P03-19). */
  zadachnik: [62, 65],
  nazvanie: 'Тетраэдр $A$, $B$, $C$, $B_1$ в прямоугольном параллелепипеде',
  tip: 'объём тетраэдра внутри параллелепипеда',
  uslovie: (p) => uslovie(p, TETRAEDR),
  otvet: (p) => abc(p).reduce((x, y) => x * y) / 6,
  poModeli: (p) => partVolume(p, TETRAEDR),
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
        text: 'Это треугольная пирамида с основанием $ABC$ — половиной основания параллелепипеда — и высотой $BB_1$.',
      },
      {
        text: `Площадь основания: $\\dfrac12\\cdot AB\\cdot BC = \\dfrac12\\cdot${ru(a)} \\cdot ${ru(b)} = ${ru((a * b) / 2)}$ ($BC = AD$).`,
        value: (a * b) / 2,
      },
      {
        text: `Объём: $\\dfrac13\\cdot ${ru((a * b) / 2)} \\cdot ${ru(c)} = ${ru((a * b * c) / 6)}$ — шестая часть параллелепипеда.`,
        value: (a * b * c) / 6,
      },
    ];
  },
};
