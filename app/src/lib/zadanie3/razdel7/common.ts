/**
 * Общее для прототипов раздела VII (вписанный и описанный цилиндр).
 *
 * Тут встречаются три разные задачи, и проверяются они по-разному.
 *
 * 1. Параллелепипед около цилиндра — обычный многогранник. Его
 *    строят по-настоящему и меряют объём по координатам; формулы
 *    4r²h в проверке нет вовсе.
 *
 * 2. Цилиндр около прямой призмы — нужен радиус описанной около
 *    основания окружности. Он не берётся как «половина гипотенузы»:
 *    центр ищется решением уравнений равных расстояний до трёх
 *    вершин настоящего треугольника, радиус — измеренным расстоянием.
 *
 * 3. Цилиндр и конус с общими основанием и высотой — отношение
 *    объёмов и отношение боковых поверхностей. Здесь важен приём:
 *    многоугольник берётся ОПИСАННЫЙ около окружности, а не
 *    вписанный. У описанного апофема равна радиусу ровно, поэтому
 *    наклонная высота боковой грани пирамиды равна образующей
 *    конуса точно, а не приближённо, и в отношении двух тел
 *    периметр сокращается без остатка. Отношение получается точным
 *    до последнего знака double при любом числе граней — проверено
 *    на 12, 48 и 200.
 */

import { box, pyramid, regularPolygon, rightPrism } from '../../solid/figures';
import { distance, polygonArea, polyhedronVolume } from '../../solid/measure';
import { type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

/** Граней в приближении круглого тела: как и в остальных разделах. */
const FACETS = 48;

/** Прямоугольный параллелепипед, описанный около цилиндра (r, h). */
export function boxAround(r: number, h: number): Polyhedron {
  return box(2 * r, 2 * r, h);
}

/** Объём этого параллелепипеда — измеренный, а не посчитанный. */
export function boxVolume(r: number, h: number): number {
  return polyhedronVolume(boxAround(r, h));
}

/**
 * Многоугольник, ОПИСАННЫЙ около окружности радиуса r: апофема
 * равна r ровно, поэтому боковая грань пирамиды на нём имеет ту же
 * наклонную высоту, что и образующая конуса.
 */
function circumscribed(r: number): Vec3[] {
  return regularPolygon(FACETS, r / Math.cos(Math.PI / FACETS), 0, 0);
}

/** Цилиндр (r, h) приближением на описанном многоугольнике. */
export function prismOut(r: number, h: number): Polyhedron {
  return rightPrism(circumscribed(r), h);
}

/** Конус (r, h) приближением на том же описанном многоугольнике. */
export function pyramidOut(r: number, h: number): Polyhedron {
  return pyramid(circumscribed(r), [0, 0, h]);
}

/** Сумма площадей перечисленных граней тела. */
function areaOf(body: Polyhedron, faces: readonly number[][]): number {
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
 * Радиус окружности, описанной около треугольника с вершинами
 * A(0,0), B(a,0), C(0,b) — прямоугольного с катетами a и b.
 *
 * Центр не берётся как середина гипотенузы: он ищется из условия
 * равных расстояний до всех трёх вершин (два уравнения, две
 * неизвестные), а радиус потом измеряется расстоянием. Так
 * проверяется и само утверждение о середине гипотенузы.
 */
export function circumradiusOfLegs(a: number, b: number): number {
  const A: Vec3 = [0, 0, 0];
  const B: Vec3 = [a, 0, 0];
  const C: Vec3 = [0, b, 0];
  /* |P−A|² = |P−B|²  →  2a·x = a²;  |P−A|² = |P−C|²  →  2b·y = b². */
  const x = (a * a) / (2 * a);
  const y = (b * b) / (2 * b);
  const centre: Vec3 = [x, y, 0];
  const r = distance(centre, A);
  if (Math.abs(distance(centre, B) - r) > 1e-9 || Math.abs(distance(centre, C) - r) > 1e-9) {
    throw new Error('Центр описанной окружности найден неверно');
  }
  return r;
}

/** Объём цилиндра в долях от объёма единичного: измерением, не формулой. */
export function volumeUnits(r: number, h: number): number {
  return cylinderVolume(r, h) / cylinderVolume(1, 1);
}

export { solveBySearch } from '../search';
