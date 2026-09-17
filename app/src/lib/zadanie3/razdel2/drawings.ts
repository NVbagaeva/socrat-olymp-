/**
 * Чертежи раздела II: прямая призма с прямоугольным треугольником
 * в основании, правильная треугольная и правильная шестиугольная
 * призмы. Пропорции фиксированы для читаемости — числа условия
 * на чертеже не показываются, их там нет и в задачнике.
 */

import { prism, regularPrism, vertex } from '../../solid/figures';
import { type Line, type Model, type Polyhedron, type Section } from '../../solid/model';
import { edge, midEdge, prismModel, unlabelled } from '../../solid/drawings/common';
import { type Vec3 } from '../../solid/vec';

/* Правильная треугольная призма для картинки. */
const TRI: [number, number] = [2.6, 4.4];
/* Правильная шестиугольная призма для картинки. */
const HEX: [number, number] = [2.6, 4];
/* Прямая призма с прямоугольным треугольником: катеты и высота. */
const LEGS: [number, number, number] = [4.6, 3.2, 4.4];

export const TRI_NAMES = 'ABCA₁B₁C₁';
export const HEX_NAMES = 'ABCDEFA₁B₁C₁D₁E₁F₁';

function legBody(): Polyhedron {
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

/** Прямая призма с прямоугольным треугольником: одна и та же картинка у P03-20/21. */
export function shapeLeg(alt: string): Model {
  const body = legBody();
  return prismModel(alt, body, { angles: legAngles(body) });
}

export const triPrism = () => regularPrism(3, TRI[0], TRI[1], 'cabinet');
export const hexPrism = () => regularPrism(6, HEX[0], HEX[1], 'cabinet');

/** Правильная треугольная призма с выделенными прямыми. */
export function shapeTriLines(alt: string, pairs: readonly (readonly [string, string])[]): Model {
  const body = triPrism();
  const lines: Line[] = pairs.map(([a, b]) => edge(body, a, b));
  return prismModel(alt, body, { lines });
}

/** Правильная шестиугольная призма с выделенными прямыми. */
export function shapeHexLines(alt: string, pairs: readonly (readonly [string, string])[]): Model {
  const body = hexPrism();
  const lines: Line[] = pairs.map(([a, b]) => edge(body, a, b));
  return prismModel(alt, body, { lines });
}

/* Плоскость через среднюю линию основания, параллельная боковому ребру. */
export function midlineCutModel(alt: string): Model {
  const body = triPrism();
  const m = midEdge(body, 'C', 'A');
  const n = midEdge(body, 'C', 'B');
  const m1 = midEdge(body, 'C1', 'A1');
  const n1 = midEdge(body, 'C1', 'B1');
  const cut: Section = { points: [m, n, n1, m1] };
  return prismModel(alt, unlabelled(body), { sections: [cut] });
}

/** Многогранник внутри треугольной призмы: перечень вершин по рёбрам многогранника. */
export function shapeTriSolid(alt: string, edges: readonly (readonly [string, string])[]): Model {
  const body = triPrism();
  const lines: Line[] = edges.map(([a, b]) => edge(body, a, b));
  return prismModel(alt, body, { lines });
}

/** Многогранник внутри шестиугольной призмы: перечень выделенных рёбер. */
export function shapeHexSolid(alt: string, edges: readonly (readonly [string, string])[]): Model {
  const body = hexPrism();
  const lines: Line[] = edges.map(([a, b]) => edge(body, a, b));
  return prismModel(alt, body, { lines });
}

/** Пирамида с вершиной apex и основанием — все остальные вершины уровня. */
export function pyramidEdges(body: Polyhedron, apex: string, base: readonly string[]): Line[] {
  return base.map((name) => edge(body, apex, name));
}

export { vertex };
