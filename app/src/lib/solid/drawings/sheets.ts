/**
 * Шпаргалки «Что нужно помнить»: 14 чертежей, по одному-трём на раздел.
 *
 * Это справочные фигуры: обозначения на них не из условия задачи,
 * а из формул — a, b, c, d, h, r, l, R, S. Подписи курсивные,
 * как в задачнике.
 */

import { box, regularPrism, regularPyramid, vertex } from '../figures';
import { type Model, type Polyhedron } from '../model';
import { ortho } from '../project';
import { edge, midEdge, prismModel, unlabelled } from './common';
import type { Vec3 } from '../vec';

const dir = (from: Vec3, to: Vec3): Vec3 => [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

/** Центр многоугольника по первым n вершинам. */
function center(body: Polyhedron, n: number): Vec3 {
  const pts = body.vertices.slice(0, n);
  return [
    pts.reduce((sum, p) => sum + p[0], 0) / n,
    pts.reduce((sum, p) => sum + p[1], 0) / n,
    pts.reduce((sum, p) => sum + p[2], 0) / n,
  ];
}

const BOX: [number, number, number] = [5, 3, 3.6];

export const SHEETS: Record<string, Model> = {
  /* I. Параллелепипед: рёбра a, b, c и диагональ d. */
  'sheet-I-1': (() => {
    const body = box(...BOX);
    const a = edge(body, 'A', 'B', 'a');
    const b = edge(body, 'B', 'C', 'b');
    const c = edge(body, 'C', 'C1', 'c');
    const d = edge(body, 'A', 'C1', 'd');
    return prismModel(
      'Прямоугольный параллелепипед: рёбра a, b, c и диагональ d',
      unlabelled(body),
      { lines: [a, b, c, d] },
    );
  })(),

  /* I. Сечение через точки A, B, C₁. */
  'sheet-I-2': (() => {
    const body = box(...BOX);
    return prismModel('Прямоугольный параллелепипед ABCDA₁B₁C₁D₁: сечение ABC₁D₁', body, {
      sections: [{ points: ['A', 'B', 'C1', 'D1'].map((n) => vertex(body, n)) }],
    });
  })(),

  /* I. Диагональное сечение ACC₁A₁. */
  'sheet-I-3': (() => {
    const body = box(...BOX);
    return prismModel(
      'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁: диагональное сечение ACC₁A₁',
      body,
      { sections: [{ points: ['A', 'C', 'C1', 'A1'].map((n) => vertex(body, n)) }] },
    );
  })(),

  /* II. Призма: площадь основания S и высота h. */
  'sheet-II-1': (() => {
    const body = regularPrism(3, 2.6, 4.4, 'cabinet');
    const h = edge(body, 'A', 'A1', 'h');
    const top = center(body, 3);
    const angles = [
      { at: vertex(body, 'A'), u: dir(vertex(body, 'A'), vertex(body, 'B')), v: [0, 0, 1] as Vec3 },
    ];
    return prismModel('Прямая призма: площадь основания S и высота h', unlabelled(body), {
      lines: [h],
      notes: [{ p: [top[0], top[1], 4.4], text: 'S' }],
      angles,
    });
  })(),

  /* II. Призма, отсечённая по средней линии основания. */
  'sheet-II-2': (() => {
    const body = regularPrism(3, 2.6, 4.4, 'cabinet');
    const m = midEdge(body, 'C', 'A');
    const n = midEdge(body, 'C', 'B');
    const m1 = midEdge(body, 'C1', 'A1');
    const n1 = midEdge(body, 'C1', 'B1');
    return prismModel(
      'Треугольная призма: сечение через среднюю линию основания, параллельное боковому ребру',
      unlabelled(body),
      { sections: [{ points: [m, n, n1, m1] }] },
    );
  })(),

  /* III. Пирамида: высота h, центр основания O, диагонали. */
  'sheet-III-1': (() => {
    const body = regularPyramid(4, 2.9, 4.2);
    const o = center(body, 4);
    const s = vertex(body, 'S');
    const model: Model = {
      alt: 'Правильная четырёхугольная пирамида SABCD: высота h = SO, центр основания O, диагонали AC и BD',
      bodies: [body],
      marks: [{ p: o, label: 'O' }],
      lines: [{ a: s, b: o, label: 'h' }, edge(body, 'A', 'C'), edge(body, 'B', 'D')],
      angles: [{ at: o, u: dir(o, s), v: dir(o, vertex(body, 'A')) }],
    };
    return model;
  })(),

  /* III. Сечение пирамиды, параллельное основанию. */
  'sheet-III-2': (() => {
    const body = regularPyramid(4, 2.9, 4.2);
    const cut = ['A', 'B', 'C', 'D'].map((n) => midEdge(body, 'S', n));
    return {
      alt: 'Правильная четырёхугольная пирамида: сечение, параллельное основанию',
      bodies: [unlabelled(body)],
      sections: [{ points: cut }],
    };
  })(),

  /* IV. Конус: высота h, радиус r, образующая l. */
  'sheet-IV-1': (() => {
    const O: Vec3 = [0, 0, 0];
    const S: Vec3 = [0, 0, 4.6];
    const A = ortho.circlePoint(O, 2.5, 0);
    return {
      alt: 'Конус: высота h, радиус основания r, образующая l',
      bodies: [{ kind: 'cone', base: O, r: 2.5, h: 4.6 }],
      lines: [
        { a: S, b: O, label: 'h' },
        { a: O, b: A, label: 'r' },
        { a: S, b: A, label: 'l' },
      ],
      angles: [{ at: O, u: A, v: S }],
    };
  })(),

  /* V. Цилиндр: высота h и радиус r. */
  'sheet-V-1': (() => {
    const O: Vec3 = [0, 0, 0];
    const O1: Vec3 = [0, 0, 4.4];
    const A1 = ortho.circlePoint(O1, 2.2, 0);
    return {
      alt: 'Цилиндр: высота h и радиус основания r',
      bodies: [{ kind: 'cylinder', base: O, r: 2.2, h: 4.4 }],
      lines: [
        { a: O1, b: O, label: 'h' },
        { a: O1, b: A1, label: 'r' },
      ],
      angles: [{ at: O1, u: A1, v: O }],
    };
  })(),

  /* VI. Шар: центр O и радиус R. */
  'sheet-VI-1': (() => {
    const O: Vec3 = [0, 0, 0];
    const A = ortho.spherePoint(O, 2.4, (35 * Math.PI) / 180);
    return {
      alt: 'Шар: центр O и радиус R',
      bodies: [{ kind: 'sphere', center: O, r: 2.4 }],
      marks: [{ p: O, label: 'O' }],
      lines: [{ a: O, b: A, label: 'R' }],
    };
  })(),

  /* VII. Цилиндр и конус с общим основанием: h, r, l. */
  'sheet-VII-1': (() => {
    const O: Vec3 = [0, 0, 0];
    const h = 3.6;
    const r = 2.5;
    const S: Vec3 = [0, 0, h];
    const A = ortho.circlePoint(O, r, 0);
    return {
      alt: 'Цилиндр и конус с общим основанием и общей высотой: высота h, радиус r, образующая конуса l',
      bodies: [
        { kind: 'cylinder', base: O, r, h, glass: true },
        { kind: 'cone', base: O, r, h, hideBase: true },
      ],
      lines: [
        { a: S, b: O, label: 'h' },
        { a: O, b: A, label: 'r' },
        { a: S, b: A, label: 'l' },
      ],
    };
  })(),

  /* VIII. Шар, вписанный в куб. */
  'sheet-VIII-1': (() => {
    const cube = unlabelled(box(4, 4, 4));
    cube.glass = true;
    return {
      alt: 'Шар, вписанный в куб: диаметр шара равен ребру куба',
      bodies: [cube, { kind: 'sphere', center: [2, 2, 2], r: 2 }],
    };
  })(),

  /* VIII. Шар, вписанный в цилиндр: R и h. */
  'sheet-VIII-2': (() => {
    const R = 2.2;
    const O: Vec3 = [0, 0, R];
    const A = ortho.circlePoint(O, R, 0);
    return {
      alt: 'Шар, вписанный в цилиндр: радиус R, высота цилиндра h равна диаметру шара',
      bodies: [
        { kind: 'cylinder', base: [0, 0, 0], r: R, h: 2 * R, glass: true },
        { kind: 'sphere', center: O, r: R },
      ],
      marks: [{ p: O, label: 'O' }],
      lines: [
        { a: [0, 0, 2 * R], b: [0, 0, 0], label: 'h' },
        { a: O, b: A, label: 'R' },
      ],
    };
  })(),

  /* VIII. Сфера, описанная около конуса: R, R и l. */
  'sheet-VIII-3': (() => {
    const R = 2.4;
    const O: Vec3 = [0, 0, 0];
    const S: Vec3 = [0, 0, R];
    const A = ortho.circlePoint(O, R, 0);
    return {
      alt: 'Сфера, описанная около конуса: радиус сферы R, радиус основания конуса R, образующая l',
      bodies: [
        { kind: 'sphere', center: O, r: R, glass: true },
        { kind: 'cone', base: O, r: R, h: R },
      ],
      marks: [{ p: O, label: 'O' }],
      lines: [
        { a: O, b: S, label: 'R' },
        { a: O, b: A, label: 'R' },
        { a: S, b: A, label: 'l' },
      ],
    };
  })(),
};
