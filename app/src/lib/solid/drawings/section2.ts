/**
 * Раздел II. Призма: прототипы P03-20 … P03-40.
 *
 * Прямая треугольная призма с прямоугольным основанием (P03-20, P03-21)
 * идёт без подписей вершин — их нет и в условии, — но с отметкой прямого
 * угла при катетах. Остальные призмы правильные, с подписями.
 */

import { prism, regularPrism, vertex } from '../figures';
import { type Model, type Polyhedron } from '../model';
import { edge, prismModel, unlabelled } from './common';
import type { Vec3 } from '../vec';

/* Правильная треугольная призма. */
const TRI: [number, number] = [2.6, 4.4];
/* Правильная шестиугольная призма. */
const HEX: [number, number] = [2.6, 4];
/* Прямая призма с прямоугольным треугольником в основании: катеты и высота. */
const LEGS: [number, number, number] = [4.6, 3.2, 4.4];

const TRI_NAMES = 'ABCA₁B₁C₁';
const HEX_NAMES = 'ABCDEFA₁B₁C₁D₁E₁F₁';

/** Призма над прямоугольным треугольником: прямой угол спереди слева. */
function legPrism(): Polyhedron {
  const [a, b, h] = LEGS;
  const body = prism(
    [
      [0, 0, 0],
      [a, 0, 0],
      [0, b, 0],
    ],
    [0, 0, h],
  );
  body.names = [null, null, null, null, null, null];
  return body;
}

/** Отметки прямого угла при катетах: в основании и на верхней грани. */
function legAngles(body: Polyhedron): Model['angles'] {
  const o = body.vertices[0] as Vec3;
  const x = body.vertices[1] as Vec3;
  const y = body.vertices[2] as Vec3;
  const o1 = body.vertices[3] as Vec3;
  const x1 = body.vertices[4] as Vec3;
  const y1 = body.vertices[5] as Vec3;
  const dir = (from: Vec3, to: Vec3): Vec3 => [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  return [
    { at: o, u: dir(o, x), v: dir(o, y) },
    { at: o1, u: dir(o1, x1), v: dir(o1, y1) },
  ];
}

/** Середина ребра по именам вершин. */
function mid(body: Polyhedron, from: string, to: string): Vec3 {
  const a = vertex(body, from);
  const b = vertex(body, to);
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

/* Плоскость через среднюю линию основания, параллельная боковому ребру:
   вертикальный прямоугольник над средней линией MN. */
function midlineSection(body: Polyhedron) {
  const m = mid(body, 'C', 'A');
  const n = mid(body, 'C', 'B');
  const m1 = mid(body, 'C1', 'A1');
  const n1 = mid(body, 'C1', 'B1');
  return { points: [m, n, n1, m1] };
}

const triPrism = () => regularPrism(3, TRI[0], TRI[1], 'cabinet');
const hexPrism = () => regularPrism(6, HEX[0], HEX[1], 'cabinet');

export const SECTION2: Record<string, Model> = {
  'P03-20': (() => {
    const body = legPrism();
    return prismModel(
      'Прямая треугольная призма, в основании прямоугольный треугольник; прямой угол отмечен',
      body,
      { angles: legAngles(body) },
    );
  })(),

  'P03-21': (() => {
    const body = legPrism();
    return prismModel(
      'Прямая треугольная призма, в основании прямоугольный треугольник; прямой угол отмечен',
      body,
      { angles: legAngles(body) },
    );
  })(),

  'P03-22': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделены прямые AA₁ и BC₁`,
      body,
      { lines: [edge(body, 'A', 'A1'), edge(body, 'B', 'C1')] },
    );
  })(),

  'P03-23': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделены прямые AA₁ и BC`,
      body,
      { lines: [edge(body, 'A', 'A1'), edge(body, 'B', 'C')] },
    );
  })(),

  'P03-24': (() => {
    const body = triPrism();
    const cut = midlineSection(body);
    return prismModel(
      'Треугольная призма, сечение через среднюю линию основания, параллельное боковому ребру',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-25': (() => {
    const body = triPrism();
    const cut = midlineSection(body);
    return prismModel(
      'Треугольная призма, сечение через среднюю линию основания, параллельное боковому ребру',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-26': (() => {
    const body = triPrism();
    const cut = midlineSection(body);
    return prismModel(
      'Треугольная призма, сечение через среднюю линию основания, параллельное боковому ребру',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-27': (() => {
    const body = triPrism();
    const cut = midlineSection(body);
    return prismModel(
      'Треугольная призма, сечение через среднюю линию основания, параллельное боковому ребру',
      unlabelled(body),
      { sections: [cut] },
    );
  })(),

  'P03-28': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, B, C, C₁`,
      body,
      { lines: [edge(body, 'A', 'C1'), edge(body, 'B', 'C1')] },
    );
  })(),

  'P03-29': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, B, C, A₁`,
      body,
      { lines: [edge(body, 'B', 'A1'), edge(body, 'C', 'A1')] },
    );
  })(),

  'P03-30': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с основанием A₁B₁C₁ и вершиной A`,
      body,
      { lines: [edge(body, 'A', 'B1'), edge(body, 'A', 'C1')] },
    );
  })(),

  'P03-31': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделен многогранник с вершинами A, C, A₁, B₁, C₁`,
      body,
      { lines: [edge(body, 'A', 'C'), edge(body, 'A', 'B1'), edge(body, 'C', 'B1')] },
    );
  })(),

  'P03-32': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделен многогранник с вершинами B, C, A₁, B₁, C₁`,
      body,
      { lines: [edge(body, 'B', 'C'), edge(body, 'B', 'A1'), edge(body, 'C', 'A1')] },
    );
  })(),

  'P03-33': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, C, A₁, B₁`,
      body,
      {
        lines: [
          edge(body, 'A', 'C'),
          edge(body, 'A', 'B1'),
          edge(body, 'C', 'A1'),
          edge(body, 'C', 'B1'),
        ],
      },
    );
  })(),

  'P03-34': (() => {
    const body = triPrism();
    return prismModel(
      `Правильная треугольная призма ${TRI_NAMES}, выделена пирамида с вершинами A, C, B₁, C₁`,
      body,
      {
        lines: [
          edge(body, 'A', 'C'),
          edge(body, 'A', 'B1'),
          edge(body, 'A', 'C1'),
          edge(body, 'C', 'B1'),
        ],
      },
    );
  })(),

  'P03-35': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделены прямые FA и D₁E₁`,
      body,
      { lines: [edge(body, 'F', 'A'), edge(body, 'D1', 'E1')] },
    );
  })(),

  'P03-36': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена треугольная призма с вершинами A, B, F, A₁, B₁, F₁`,
      body,
      { lines: [edge(body, 'B', 'F'), edge(body, 'B1', 'F1')] },
    );
  })(),

  'P03-37': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена призма с вершинами A, C, D, F, A₁, C₁, D₁, F₁`,
      body,
      {
        lines: [
          edge(body, 'A', 'C'),
          edge(body, 'D', 'F'),
          edge(body, 'A1', 'C1'),
          edge(body, 'D1', 'F1'),
        ],
      },
    );
  })(),

  'P03-38': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена пирамида с основанием A₁B₁C₁D₁E₁F₁ и вершиной F`,
      body,
      {
        lines: [
          edge(body, 'F', 'A1'),
          edge(body, 'F', 'B1'),
          edge(body, 'F', 'C1'),
          edge(body, 'F', 'D1'),
          edge(body, 'F', 'E1'),
        ],
      },
    );
  })(),

  'P03-39': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена пирамида с основанием ABCDEF и вершиной B₁`,
      body,
      {
        lines: [
          edge(body, 'B1', 'A'),
          edge(body, 'B1', 'C'),
          edge(body, 'B1', 'D'),
          edge(body, 'B1', 'E'),
          edge(body, 'B1', 'F'),
        ],
      },
    );
  })(),

  'P03-40': (() => {
    const body = hexPrism();
    return prismModel(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделена пирамида с вершинами A₁, B₁, F₁, A`,
      body,
      { lines: [edge(body, 'B1', 'F1'), edge(body, 'A', 'B1'), edge(body, 'A', 'F1')] },
    );
  })(),
};
