/**
 * Сечение в натуральную величину: многоугольник в своей плоскости,
 * без искажений проекции. Длины сторон — те же, что у сечения.
 */

import { type P2, type V, cross, dist, dot, norm, sub } from './geom';
import type { Sechenie } from './scena';

export interface Naturalnaya {
  pts: P2[];
  names: (string | null)[];
  /** Длины сторон: i-я — от вершины i к i + 1. */
  storony: number[];
}

export function naturalnaya(s: Sechenie): Naturalnaya {
  const p0 = s.pts[0] as V;
  const u = norm(sub(s.pts[1] as V, p0));
  const w = cross(s.n, u);
  // Ось y — вверх по экрану: в SVG вниз, поэтому знак меняется при рисовании.
  const pts = s.pts.map((p): P2 => [dot(sub(p, p0), u), dot(sub(p, p0), w)]);
  const storony = s.pts.map((a, i) => dist(a, s.pts[(i + 1) % s.pts.length] as V));
  return { pts, names: s.names, storony };
}
