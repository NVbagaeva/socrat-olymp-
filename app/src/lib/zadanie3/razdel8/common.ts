/**
 * Общее для прототипов раздела VIII (вписанная и описанная сфера).
 *
 * Про шар нельзя сказать «померяем многогранник и получим точный
 * ответ»: его объём и поверхность содержат π, а многогранник даёт
 * лишь приближение. Но шар можно СВЕСТИ к телам, которые меряются
 * точно, — и это делает не формула, а две классические теоремы,
 * каждая из которых отличается от проверяемой формулы:
 *
 * 1. Принцип Кавальери. У шара радиуса r и у цилиндра (r, 2r),
 *    из которого вырезаны два конуса (r, r), в каждой высоте
 *    одинаковые сечения, значит равны и объёмы. Поэтому объём шара
 *    берётся как измеренный объём призмы минус два измеренных
 *    объёма пирамид — формулы 4/3·πr³ в проверке нет.
 *
 * 2. Теорема Архимеда о поверхности («шляпная коробка»). Площадь
 *    сферы равна боковой поверхности описанного около неё цилиндра.
 *    Поэтому отношение полной поверхности цилиндра к поверхности
 *    шара берётся как измеренное (боковая + два основания) к
 *    измеренной боковой — формулы 4πr² в проверке нет.
 *
 * Многоугольник во всех приближениях описанный, поэтому периметр
 * в отношениях сокращается без остатка и совпадение выходит точным,
 * а не близким.
 */

import { box } from '../../solid/figures';
import { distance, polygonArea, polyhedronVolume } from '../../solid/measure';
import { type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { baseArea, cylinderLateral, prismUnits, pyramidUnits } from '../round';

/**
 * Объём шара радиуса r, делённый на π, — по Кавальери: цилиндр
 * (r, 2r) без двух конусов (r, r). Оба тела измерены, а не
 * посчитаны; делённым на π результат выходит потому, что за
 * единицу взят цилиндр (1, 1), объём которого равен π.
 */
export function ballOverPi(r: number): number {
  return prismUnits(r, 2 * r) - 2 * pyramidUnits(r, r);
}

/**
 * Во сколько раз объём описанного цилиндра больше объёма шара.
 * У настоящих тел это ровно 1,5; здесь — отношение двух измеренных
 * объёмов, в котором приближение сокращается.
 */
export function cylinderOverBallVolume(r: number): number {
  return prismUnits(r, 2 * r) / ballOverPi(r);
}

/**
 * Во сколько раз полная поверхность описанного цилиндра больше
 * поверхности вписанного шара. По Архимеду поверхность шара равна
 * боковой поверхности цилиндра, поэтому обе величины измеряются
 * на одном теле: (боковая + два основания) к боковой.
 */
export function cylinderOverBallArea(r: number): number {
  const lateral = cylinderLateral(r, 2 * r);
  return (lateral + 2 * baseArea(r)) / lateral;
}

/** Куб с ребром a — настоящий многогранник. */
export function cube(a: number): Polyhedron {
  return box(a, a, a);
}

/** Объём куба измерением, а не возведением в куб. */
export function cubeVolume(a: number): number {
  return polyhedronVolume(cube(a));
}

/**
 * Радиус шара, вписанного в куб с ребром a: наименьшее расстояние
 * от центра куба до плоскостей его граней. Не «половина ребра»,
 * а измеренное расстояние до настоящих граней.
 */
export function inradiusOfCube(a: number): number {
  const body = cube(a);
  const centre: Vec3 = [a / 2, a / 2, a / 2];
  const distances = body.faces.map((face) => {
    const pts = face.map((i) => body.vertices[i] as Vec3);
    const p0 = pts[0] as Vec3;
    const p1 = pts[1] as Vec3;
    const p2 = pts[2] as Vec3;
    const u: Vec3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const v: Vec3 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const n: Vec3 = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const len = Math.hypot(n[0], n[1], n[2]);
    const d = (centre[0] - p0[0]) * n[0] + (centre[1] - p0[1]) * n[1] + (centre[2] - p0[2]) * n[2];
    return Math.abs(d) / len;
  });
  return Math.min(...distances);
}

/**
 * Образующая конуса, вписанного в сферу радиуса R так, что центр
 * сферы — центр основания конуса. Тогда и точка окружности
 * основания, и вершина лежат на сфере, то есть на расстоянии R от
 * центра; образующая — измеренное расстояние между ними.
 */
export function slantBySphere(R: number): number {
  const centre: Vec3 = [0, 0, 0];
  const edge: Vec3 = [R, 0, 0];
  const apex: Vec3 = [0, 0, R];
  if (Math.abs(distance(centre, edge) - R) > 1e-9 || Math.abs(distance(centre, apex) - R) > 1e-9) {
    throw new Error('Вершина или точка основания не лежит на сфере');
  }
  return distance(edge, apex);
}

/**
 * Во сколько раз объём шара больше объёма вписанного конуса,
 * у которого радиус основания равен радиусу шара. Высота такого
 * конуса — измеренное расстояние от центра основания до вершины
 * на сфере, а объёмы — измеренные.
 */
export function ballOverConeVolume(R: number): number {
  const height = distance([0, 0, 0], [0, 0, R]);
  return ballOverPi(R) / pyramidUnits(R, height);
}

/** Площадь основания понадобится и снаружи — для проверок. */
export { baseArea, polygonArea };

export { solveBySearch } from '../search';
