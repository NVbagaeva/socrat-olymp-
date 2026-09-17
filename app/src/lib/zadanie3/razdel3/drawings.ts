/**
 * Чертежи раздела III: правильная пирамида (четырёхугольная,
 * треугольная, шестиугольная). Вид ортогональный, как у всех
 * пирамид. Пропорции фиксированы для читаемости — числа условия
 * на чертеже не показываются.
 */

import { baseCenter, regularPyramid, vertex } from '../../solid/figures';
import { type Model, type Polyhedron } from '../../solid/model';
import { edge, midEdge, prismModel, unlabelled } from '../../solid/drawings/common';
import type { Vec3 } from '../../solid/vec';

const PYR4: [number, number] = [2.9, 4.2];
const PYR3: [number, number] = [2.6, 4.2];
const PYR6: [number, number] = [2.8, 4];

export const NAMES4 = 'SABCD';

export const p4 = () => regularPyramid(4, PYR4[0], PYR4[1]);
export const p3 = () => regularPyramid(3, PYR3[0], PYR3[1]);
export const p6 = () => regularPyramid(6, PYR6[0], PYR6[1]);

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

/** Пирамида SABCD с высотой SO и диагоналями основания — P03-41/42/43. */
export function shapeHeightDiagonals(alt: string): Model {
  const body = p4();
  return pyramidModel(
    alt,
    body,
    withHeight(body, 4, true, { lines: [edge(body, 'A', 'C'), edge(body, 'B', 'D')] }),
  );
}

/** Правильная n-угольная пирамида с высотой, без букв — P03-44/46/49/51. */
export function shapeHeightOnly(alt: string, n: 3 | 4 | 6): Model {
  const body = n === 4 ? p4() : n === 3 ? p3() : p6();
  /* Считаем по именованным вершинам ДО того, как unlabelled сотрёт имена. */
  const parts = withHeight(body, n, false);
  return pyramidModel(alt, unlabelled(body), parts);
}

/** Сечение через середины боковых рёбер квадратной пирамиды — P03-45. */
export function shapeMidSection(alt: string): Model {
  const body = p4();
  const cut = ['A', 'B', 'C', 'D'].map((name) => midEdge(body, 'S', name));
  const sections = [{ points: cut }];
  return pyramidModel(alt, unlabelled(body), { sections });
}

/** Выделенное боковое ребро SC — P03-47. */
export function shapeLateralEdge(alt: string): Model {
  const body = p4();
  return pyramidModel(alt, body, { lines: [edge(body, 'S', 'C')] });
}

/** E — середина SB, выделена пирамида EABC — P03-48. */
export function shapeMidpointPyramid(alt: string): Model {
  const body = p4();
  const e = midEdge(body, 'S', 'B');
  return pyramidModel(alt, body, {
    marks: [{ p: e, label: 'E' }],
    lines: [{ a: e, b: vertex(body, 'A') }, { a: e, b: vertex(body, 'C') }, edge(body, 'A', 'C')],
  });
}

/** Сечение через вершину и среднюю линию основания треугольной пирамиды — P03-50. */
export function shapeVertexMidline(alt: string): Model {
  const body = p3();
  const cut = [midEdge(body, 'C', 'A'), midEdge(body, 'C', 'B'), vertex(body, 'S')];
  const sections = [{ points: cut }];
  return pyramidModel(alt, unlabelled(body), { sections });
}
