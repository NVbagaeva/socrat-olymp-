/**
 * Общее для прототипов раздела III (пирамида).
 *
 * Правильная пирамида задаётся стороной основания и высотой —
 * настоящей геометрией для независимой проверки. Чертёж, как и
 * в разделе II, рисуется отдельными фиксированными пропорциями.
 */

import { regularPyramid, vertex } from '../../solid/figures';
import { type Polyhedron } from '../../solid/model';
import { type Vec3 } from '../../solid/vec';

/** Правильный n-угольник: сторона → радиус описанной окружности. */
export function circumradius(n: number, side: number): number {
  return side / (2 * Math.sin(Math.PI / n));
}

/** Правильная пирамида по стороне основания и высоте: настоящая геометрия. */
export function regularPyramidByEdge(n: number, side: number, h: number): Polyhedron {
  return regularPyramid(n, circumradius(n, side), h);
}

/** Точка настоящей модели по имени вершины. */
export function point(body: Polyhedron, name: string): Vec3 {
  return vertex(body, name);
}
