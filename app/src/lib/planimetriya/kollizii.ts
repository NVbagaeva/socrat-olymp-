/**
 * Препятствия для подписей чертежа и расстояния до них, в пикселях.
 *
 * Каждая линия чертежа — отрезок с половиной толщины, окружность —
 * центр и радиус, подпись — прямоугольник. Подпись чиста, если до
 * каждого препятствия остаётся зазор. Этим же кодом автотест
 * проверяет готовый рисунок: правило «подписи не перекрывают ни
 * друг друга, ни линии, ни кривые» одно на движок и на тест.
 */

import type { T2 } from './types';

export interface Pryam {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Prepyatstvie =
  | { tip: 'otrezok'; a: T2; b: T2; r: number; chto: string }
  | { tip: 'krug'; c: T2; r: number; tolshchina: number; chto: string }
  | { tip: 'pryam'; p: Pryam; chto: string }
  | { tip: 'tochka'; c: T2; r: number; chto: string };

function pointRectDist(p: T2, r: Pryam): number {
  const dx = Math.max(r.left - p[0], 0, p[0] - r.right);
  const dy = Math.max(r.top - p[1], 0, p[1] - r.bottom);
  return Math.hypot(dx, dy);
}

function inside(p: T2, r: Pryam): boolean {
  return p[0] >= r.left && p[0] <= r.right && p[1] >= r.top && p[1] <= r.bottom;
}

function segsCross(a: T2, b: T2, c: T2, d: T2): boolean {
  const o = (p: T2, q: T2, s: T2) => (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
  const o1 = o(a, b, c);
  const o2 = o(a, b, d);
  const o3 = o(c, d, a);
  const o4 = o(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function pointSeg(p: T2, a: T2, b: T2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Расстояние от отрезка до прямоугольника (0 — касаются или пересекаются). */
export function segRectDist(a: T2, b: T2, r: Pryam): number {
  if (inside(a, r) || inside(b, r)) return 0;
  const c: T2[] = [
    [r.left, r.top],
    [r.right, r.top],
    [r.right, r.bottom],
    [r.left, r.bottom],
  ];
  for (let i = 0; i < 4; i += 1) {
    if (segsCross(a, b, c[i]!, c[(i + 1) % 4]!)) return 0;
  }
  let m = Math.min(pointRectDist(a, r), pointRectDist(b, r));
  for (let i = 0; i < 4; i += 1) {
    m = Math.min(m, pointSeg(c[i]!, a, b));
  }
  return m;
}

export function rectGap(a: Pryam, b: Pryam): number {
  const dx = Math.max(a.left - b.right, b.left - a.right, 0);
  const dy = Math.max(a.top - b.bottom, b.top - a.bottom, 0);
  if (dx === 0 && dy === 0) {
    /* Перекрываются: отрицательный зазор — глубина перекрытия. */
    return -Math.min(
      Math.min(a.right, b.right) - Math.max(a.left, b.left),
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
    );
  }
  return Math.hypot(dx, dy);
}

/** Расстояние от окружности (линии) до прямоугольника. */
export function circleRectDist(c: T2, rad: number, r: Pryam): number {
  const dmin = pointRectDist(c, r);
  const corners: T2[] = [
    [r.left, r.top],
    [r.right, r.top],
    [r.right, r.bottom],
    [r.left, r.bottom],
  ];
  const dmax = Math.max(...corners.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
  if (dmin <= rad && dmax >= rad) return 0;
  return dmax < rad ? rad - dmax : dmin - rad;
}

/** Зазор от прямоугольника до препятствия (отрицательный — перекрытие). */
export function zazor(p: Pryam, o: Prepyatstvie): number {
  switch (o.tip) {
    case 'otrezok':
      return segRectDist(o.a, o.b, p) - o.r;
    case 'krug':
      return circleRectDist(o.c, o.r, p) - o.tolshchina / 2;
    case 'tochka':
      return pointRectDist(o.c, p) - o.r;
    default:
      return rectGap(p, o.p);
  }
}

/** Наименьший зазор и то, что мешает. */
export function blizhayshee(
  p: Pryam,
  prep: readonly Prepyatstvie[],
): { min: number; chto: string } {
  let min = Infinity;
  let chto = '';
  for (const o of prep) {
    const d = zazor(p, o);
    if (d < min) {
      min = d;
      chto = o.chto;
    }
  }
  return { min, chto };
}
