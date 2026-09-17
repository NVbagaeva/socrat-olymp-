/**
 * Раздел III. Пирамида: прототипы P03-41 … P03-51.
 *
 * Вид ортогональный, как у всех пирамид. На чертеже — только то, что
 * есть в условии: высота SO и диагонали основания там, где о них речь,
 * сечение там, где спрашивают сечение.
 */

import { baseCenter, regularPyramid, vertex } from '../figures';
import { type Model, type Polyhedron } from '../model';
import { edge, midEdge, prismModel, unlabelled } from './common';
import type { Vec3 } from '../vec';

const PYR4: [number, number] = [2.9, 4.2];
const PYR3: [number, number] = [2.6, 4.2];
const PYR6: [number, number] = [2.8, 4];

const NAMES4 = 'SABCD';

const p4 = () => regularPyramid(4, PYR4[0], PYR4[1]);
const p3 = () => regularPyramid(3, PYR3[0], PYR3[1]);
const p6 = () => regularPyramid(6, PYR6[0], PYR6[1]);

/** Модель пирамиды: вид ортогональный, поэтому view не указываем. */
function pyramidModel(alt: string, body: Polyhedron, rest: Partial<Model> = {}): Model {
  const model = prismModel(alt, body, rest);
  delete model.view;
  return model;
}

function dir(from: Vec3, to: Vec3): Vec3 {
  return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
}

/**
 * Пирамида с высотой SO. Точка O подписывается только там, где она
 * названа в условии; прямой угол при основании отмечается всегда.
 */
function withHeight(
  body: Polyhedron,
  n: number,
  labelled: boolean,
  extra: Partial<Model> = {},
): Partial<Model> {
  const o = baseCenter(body, n);
  const s = vertex(body, 'S');
  const a = vertex(body, 'A');
  return {
    marks: labelled ? [{ p: o, label: 'O' }, ...(extra.marks ?? [])] : (extra.marks ?? []),
    lines: [{ a: s, b: o }, ...(extra.lines ?? [])],
    angles: [{ at: o, u: dir(o, s), v: dir(o, a) }, ...(extra.angles ?? [])],
    ...(extra.sections ? { sections: extra.sections } : {}),
  };
}

export const SECTION3: Record<string, Model> = {
  /* P03-41, P03-42, P03-43 — одна и та же фигура: SABCD, центр O,
     высота SO и диагонали основания. Различаются тем, что дано. */
  'P03-41': (() => {
    const body = p4();
    return pyramidModel(
      `Правильная четырёхугольная пирамида ${NAMES4}, O — центр основания, показаны высота SO и диагонали AC и BD`,
      body,
      withHeight(body, 4, true, { lines: [edge(body, 'A', 'C'), edge(body, 'B', 'D')] }),
    );
  })(),

  'P03-42': (() => {
    const body = p4();
    return pyramidModel(
      `Правильная четырёхугольная пирамида ${NAMES4}, O — центр основания, показаны высота SO и диагонали AC и BD`,
      body,
      withHeight(body, 4, true, { lines: [edge(body, 'A', 'C'), edge(body, 'B', 'D')] }),
    );
  })(),

  'P03-43': (() => {
    const body = p4();
    return pyramidModel(
      `Правильная четырёхугольная пирамида ${NAMES4}, O — центр основания, показаны высота SO и диагонали AC и BD`,
      body,
      withHeight(body, 4, true, { lines: [edge(body, 'A', 'C'), edge(body, 'B', 'D')] }),
    );
  })(),

  'P03-44': (() => {
    const body = p4();
    const parts = withHeight(body, 4, false);
    return pyramidModel(
      'Правильная четырёхугольная пирамида с высотой: дано боковое ребро и сторона основания',
      unlabelled(body),
      parts,
    );
  })(),

  /* Сечение через середины боковых рёбер: квадрат на половине высоты. */
  'P03-45': (() => {
    const body = p4();
    const cut = ['A', 'B', 'C', 'D'].map((name) => midEdge(body, 'S', name));
    return pyramidModel(
      'Правильная четырёхугольная пирамида, сечение через середины боковых рёбер',
      unlabelled(body),
      { sections: [{ points: cut }] },
    );
  })(),

  'P03-46': (() => {
    const body = p4();
    const parts = withHeight(body, 4, false);
    return pyramidModel(
      'Правильная четырёхугольная пирамида с высотой: даны высота и боковое ребро',
      unlabelled(body),
      parts,
    );
  })(),

  'P03-47': (() => {
    const body = p4();
    return pyramidModel(
      `Правильная четырёхугольная пирамида ${NAMES4}, выделено боковое ребро SC`,
      body,
      { lines: [edge(body, 'S', 'C')] },
    );
  })(),

  /* E — середина ребра SB, выделена пирамида EABC. */
  'P03-48': (() => {
    const body = p4();
    const e = midEdge(body, 'S', 'B');
    return pyramidModel(
      `Правильная четырёхугольная пирамида ${NAMES4}, E — середина ребра SB, выделена пирамида EABC`,
      body,
      {
        marks: [{ p: e, label: 'E' }],
        lines: [
          { a: e, b: vertex(body, 'A') },
          { a: e, b: vertex(body, 'C') },
          edge(body, 'A', 'C'),
        ],
      },
    );
  })(),

  'P03-49': (() => {
    const body = p3();
    const parts = withHeight(body, 3, false);
    return pyramidModel(
      'Правильная треугольная пирамида с высотой: даны боковое ребро и сторона основания',
      unlabelled(body),
      parts,
    );
  })(),

  /* Плоскость через вершину и среднюю линию основания. */
  'P03-50': (() => {
    const body = p3();
    const cut = [midEdge(body, 'C', 'A'), midEdge(body, 'C', 'B'), vertex(body, 'S')];
    return pyramidModel(
      'Треугольная пирамида, сечение через вершину и среднюю линию основания',
      unlabelled(body),
      { sections: [{ points: cut }] },
    );
  })(),

  'P03-51': (() => {
    const body = p6();
    const parts = withHeight(body, 6, false);
    return pyramidModel(
      'Правильная шестиугольная пирамида с высотой: даны боковое ребро и сторона основания',
      unlabelled(body),
      parts,
    );
  })(),
};
