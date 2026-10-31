/**
 * Геометрия живых схем. Основа — чистые функции движка №1
 * (lib/planimetriya/geom.ts); здесь то, чего там нет: вневписанная
 * окружность, углы в градусах, проверки положения точки на отрезке,
 * общие касательные и случайные треугольники по углам.
 */

import {
  add,
  angleAt,
  angleOf,
  circumcircle,
  cross,
  dist,
  dot,
  foot,
  incircle,
  intersect,
  len,
  lerp,
  lineCircle,
  mid,
  mul,
  orthocenter,
  polar,
  projT,
  rotate,
  sub,
  tangentPoints,
  unit,
  type Krug,
} from '@/lib/planimetriya/geom';
import type { T2 } from './tipy';

export {
  add,
  angleAt,
  angleOf,
  circumcircle,
  cross,
  dist,
  dot,
  foot,
  incircle,
  intersect,
  len,
  lerp,
  lineCircle,
  mid,
  mul,
  orthocenter,
  polar,
  projT,
  rotate,
  sub,
  tangentPoints,
  unit,
  type Krug,
};

export const RAD = Math.PI / 180;

/** Центр и радиус вневписанной окружности, касающейся стороны BC (напротив A). */
export function vnevpisannaya(a: T2, b: T2, c: T2): Krug {
  const la = dist(b, c);
  const lb = dist(a, c);
  const lc = dist(a, b);
  const k = -la + lb + lc;
  const centr: T2 = [
    (-la * a[0] + lb * b[0] + lc * c[0]) / k,
    (-la * a[1] + lb * b[1] + lc * c[1]) / k,
  ];
  const s = Math.abs(cross(sub(b, a), sub(c, a))) / 2;
  return { c: centr, r: (2 * s) / k };
}

/** Окружность с диаметром PQ. */
export function naDiametre(p: T2, q: T2): Krug {
  return { c: mid(p, q), r: dist(p, q) / 2 };
}

/** Углы треугольника ABC в градусах: [A, B, C]. */
export function uglyTreugolnika(a: T2, b: T2, c: T2): [number, number, number] {
  return [angleAt(b, a, c), angleAt(a, b, c), angleAt(a, c, b)];
}

/** Лежит ли основание проекции P на прямую AB внутри отрезка AB (с допуском). */
export function vnutriOtrezka(p: T2, a: T2, b: T2, dopusk = 1e-9): boolean {
  const t = projT(p, a, b);
  return t >= -dopusk && t <= 1 + dopusk;
}

/** Ориентированная площадь (удвоенная) треугольника ABC: > 0 — против часовой. */
export function orient(a: T2, b: T2, c: T2): number {
  return cross(sub(b, a), sub(c, a));
}

/**
 * Треугольник по углам A и B (градусы) с основанием AC длины osnovanie:
 * A в начале координат, C на оси x, B сверху.
 */
export function treugolnikPoUglam(
  ugolA: number,
  ugolC: number,
  osnovanie = 6,
): Record<'A' | 'B' | 'C', T2> {
  const a: T2 = [0, 0];
  const c: T2 = [osnovanie, 0];
  const b = intersect(a, polar(ugolA), c, add(c, polar(180 - ugolC))) ?? [osnovanie / 2, 1];
  return { A: a, B: b, C: c };
}

/** Число с округлением и десятичной запятой в TeX: 0{,}44. */
export function chisloTeX(x: number, znakov = 2): string {
  /* −0,001 не должно стать «−0,00». */
  const okruglennoe = Math.abs(x) < 0.5 * 10 ** -znakov ? 0 : x;
  return okruglennoe.toFixed(znakov).replace('.', '{,}');
}
