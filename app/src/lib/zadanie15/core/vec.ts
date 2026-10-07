/**
 * Точные векторы, прямые и плоскости в пространстве.
 *
 * Все координаты — дроби (rational.ts), поэтому «лежит в плоскости»,
 * «параллельны», «пересекаются» решаются точно, без epsilon.
 */

import {
  type Rat,
  add as radd,
  div as rdiv,
  eq as req,
  isZero,
  mul as rmul,
  neg as rneg,
  rat,
  sub as rsub,
  toNumber,
} from './rational';

export interface V3 {
  readonly x: Rat;
  readonly y: Rat;
  readonly z: Rat;
}

export const v3 = (x: Rat, y: Rat, z: Rat): V3 => ({ x, y, z });
export const v3n = (x: number, y: number, z: number): V3 => ({ x: rat(x), y: rat(y), z: rat(z) });

export const add = (a: V3, b: V3): V3 => v3(radd(a.x, b.x), radd(a.y, b.y), radd(a.z, b.z));
export const sub = (a: V3, b: V3): V3 => v3(rsub(a.x, b.x), rsub(a.y, b.y), rsub(a.z, b.z));
export const scale = (a: V3, k: Rat): V3 => v3(rmul(a.x, k), rmul(a.y, k), rmul(a.z, k));
export const neg = (a: V3): V3 => v3(rneg(a.x), rneg(a.y), rneg(a.z));
export const dot = (a: V3, b: V3): Rat =>
  radd(radd(rmul(a.x, b.x), rmul(a.y, b.y)), rmul(a.z, b.z));
export const cross = (a: V3, b: V3): V3 =>
  v3(
    rsub(rmul(a.y, b.z), rmul(a.z, b.y)),
    rsub(rmul(a.z, b.x), rmul(a.x, b.z)),
    rsub(rmul(a.x, b.y), rmul(a.y, b.x)),
  );
export const veq = (a: V3, b: V3): boolean => req(a.x, b.x) && req(a.y, b.y) && req(a.z, b.z);
export const isNull = (a: V3): boolean => isZero(a.x) && isZero(a.y) && isZero(a.z);
/** Квадрат длины — дробь. */
export const len2 = (a: V3): Rat => dot(a, a);
/** a + t(b − a). */
export const lerp = (a: V3, b: V3, t: Rat): V3 => add(a, scale(sub(b, a), t));
export const toArray = (a: V3): [number, number, number] => [
  toNumber(a.x),
  toNumber(a.y),
  toNumber(a.z),
];

/** Коллинеарны ли векторы (нулевой коллинеарен любому). */
export const collinear = (a: V3, b: V3): boolean => isNull(cross(a, b));

/** Прямая: точка и направление (ненулевое). */
export interface Line3 {
  readonly p: V3;
  readonly dir: V3;
}

/** Плоскость n·X = c, n ≠ 0. */
export interface Plane {
  readonly n: V3;
  readonly c: Rat;
}

export function lineThrough(a: V3, b: V3): Line3 {
  const dir = sub(b, a);
  if (isNull(dir)) throw new Error('lineThrough: точки совпадают');
  return { p: a, dir };
}

/** Плоскость через три точки; null, если они на одной прямой. */
export function planeThrough(a: V3, b: V3, c: V3): Plane | null {
  const n = cross(sub(b, a), sub(c, a));
  if (isNull(n)) return null;
  return { n, c: dot(n, a) };
}

/** Значение n·X − c: знак показывает сторону, ноль — точка в плоскости. */
export const side = (pl: Plane, x: V3): Rat => rsub(dot(pl.n, x), pl.c);
export const onPlane = (pl: Plane, x: V3): boolean => isZero(side(pl, x));

/** Совпадают ли плоскости (нормали коллинеарны и общая точка). */
export function samePlane(a: Plane, b: Plane): boolean {
  if (!collinear(a.n, b.n)) return false;
  // Точка плоскости a: подставляем в b через пропорциональность.
  // n_b = k·n_a ⇒ c_b должно быть k·c_a.
  const k = ratioOf(b.n, a.n);
  return k !== null && req(b.c, rmul(a.c, k));
}

/** k, при котором u = k·v (v ≠ 0, векторы коллинеарны). */
export function ratioOf(u: V3, v: V3): Rat | null {
  for (const key of ['x', 'y', 'z'] as const) {
    if (!isZero(v[key])) return rdiv(u[key], v[key]);
  }
  return null;
}

export const parallelPlanes = (a: Plane, b: Plane): boolean => collinear(a.n, b.n);

export const onLine = (l: Line3, x: V3): boolean => collinear(sub(x, l.p), l.dir);

export const parallelLines = (a: Line3, b: Line3): boolean => collinear(a.dir, b.dir);

export function sameLine(a: Line3, b: Line3): boolean {
  return parallelLines(a, b) && onLine(a, b.p);
}

/** Лежат ли две прямые в одной плоскости. */
export function coplanarLines(a: Line3, b: Line3): boolean {
  return isZero(dot(sub(b.p, a.p), cross(a.dir, b.dir)));
}

/**
 * Точка пересечения двух прямых. null — если параллельны, совпадают
 * или скрещиваются (не лежат в одной плоскости).
 */
export function intersectLines(a: Line3, b: Line3): V3 | null {
  if (parallelLines(a, b) || !coplanarLines(a, b)) return null;
  // a.p + s·a.dir = b.p + t·b.dir ⇒ s = ((b.p − a.p) × b.dir)·(a.dir × b.dir) / |a.dir × b.dir|²
  const w = cross(a.dir, b.dir);
  const s = rdiv(dot(cross(sub(b.p, a.p), b.dir), w), dot(w, w));
  return add(a.p, scale(a.dir, s));
}

/** Пересечение прямой с плоскостью; null — параллельна или лежит в ней. */
export function intersectLinePlane(l: Line3, pl: Plane): V3 | null {
  const den = dot(pl.n, l.dir);
  if (isZero(den)) return null;
  const t = rdiv(rsub(pl.c, dot(pl.n, l.p)), den);
  return add(l.p, scale(l.dir, t));
}

/** Параметр t точки x на прямой a + t(b − a) (x лежит на прямой). */
export function paramOn(a: V3, b: V3, x: V3): Rat {
  const k = ratioOf(sub(x, a), sub(b, a));
  if (k === null) throw new Error('paramOn: точки a и b совпадают');
  return k;
}
