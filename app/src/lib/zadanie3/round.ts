/**
 * Круглые тела приближением, общее для разделов VII и VIII.
 *
 * Многоугольник берётся ОПИСАННЫЙ около окружности, а не вписанный:
 * у описанного апофема равна радиусу ровно. Из-за этого наклонная
 * высота боковой грани пирамиды совпадает с образующей конуса точно,
 * площадь основания равна ровно (периметр · радиус) / 2, а в любом
 * ОТНОШЕНИИ двух таких тел периметр сокращается без остатка.
 * Поэтому измеренные отношения выходят точными до последнего знака
 * double при любом числе граней — проверено на 12, 48 и 200.
 */

import { pyramid, regularPolygon, rightPrism } from '../solid/figures';
import { polygonArea, polyhedronVolume } from '../solid/measure';
import { type Polyhedron } from '../solid/model';
import type { Vec3 } from '../solid/vec';

/** Граней в приближении круглого тела: как и в остальных разделах. */
const FACETS = 48;

/** Многоугольник, описанный около окружности радиуса r: апофема равна r. */
export function circumscribed(r: number): Vec3[] {
  return regularPolygon(FACETS, r / Math.cos(Math.PI / FACETS), 0, 0);
}

/** Цилиндр (r, h) приближением. */
export function prismOut(r: number, h: number): Polyhedron {
  return rightPrism(circumscribed(r), h);
}

/** Конус (r, h) приближением на том же многоугольнике. */
export function pyramidOut(r: number, h: number): Polyhedron {
  return pyramid(circumscribed(r), [0, 0, h]);
}

/** Сумма площадей перечисленных граней тела. */
export function areaOf(body: Polyhedron, faces: readonly number[][]): number {
  return faces.reduce(
    (sum, face) => sum + polygonArea(face.map((i) => body.vertices[i] as Vec3)),
    0,
  );
}

/** Боковая поверхность цилиндра приближением: без двух оснований. */
export function cylinderLateral(r: number, h: number): number {
  const body = prismOut(r, h);
  return areaOf(body, body.faces.slice(2));
}

/** Площадь основания приближением. */
export function baseArea(r: number): number {
  const body = prismOut(r, 1);
  return areaOf(body, body.faces.slice(0, 1));
}

/** Боковая поверхность конуса приближением: без основания. */
export function coneLateral(r: number, h: number): number {
  const body = pyramidOut(r, h);
  return areaOf(body, body.faces.slice(1));
}

/** Объём цилиндра приближением. */
export function cylinderVolume(r: number, h: number): number {
  return polyhedronVolume(prismOut(r, h));
}

/** Объём конуса приближением. */
export function coneVolume(r: number, h: number): number {
  return polyhedronVolume(pyramidOut(r, h));
}

/**
 * Объём цилиндра (r, h) в долях от объёма единичного цилиндра.
 * У настоящего цилиндра это ровно r²h, но здесь число получено
 * измерением граней настоящего многогранника.
 */
export function prismUnits(r: number, h: number): number {
  return cylinderVolume(r, h) / cylinderVolume(1, 1);
}

/** Объём конуса (r, h) в тех же долях: у настоящего это r²h/3. */
export function pyramidUnits(r: number, h: number): number {
  return coneVolume(r, h) / cylinderVolume(1, 1);
}
