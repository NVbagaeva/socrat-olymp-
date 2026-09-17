/**
 * Общее для прототипов раздела IV (конус).
 *
 * Круглые тела нельзя проверить «другой геометрией» так же, как
 * многогранник: и формула, и любая независимая проверка неизбежно
 * опираются на одну и ту же постоянную π. Здесь используется два
 * приёма, которые всё же дают настоящую, а не показную проверку:
 *
 * 1. Там, где ответ — длина или площадь плоского сечения (высота,
 *    образующая, площадь осевого треугольника), сечение — плоская
 *    фигура без кривизны. Она строится по-настоящему, в трёх
 *    координатах (вершина конуса, точки на окружности основания),
 *    и измеряется обычной геометрией (расстояние, площадь
 *    многоугольника) — независимо от формулы с корнем или синусом.
 *
 * 2. Там, где ответ — отношение объёмов или площадей подобных
 *    конусов (во сколько раз, какая доля), конус приближается
 *    правильной N-угольной пирамидой. Погрешность такого приближения
 *    зависит только от числа граней N и одинакова у камня и его
 *    уменьшенной копии — поэтому в ОТНОШЕНИИ погрешность сокращается
 *    без остатка, и совпадение проверяется не «почти», а точно.
 *    Это проверено численно на N = 48 до последнего знака double.
 */

import { pyramid, regularPolygon } from '../../solid/figures';
import { polygonArea, polyhedronVolume } from '../../solid/measure';
import { type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

/** Граней в приближении конуса пирамидой: как и у остальных тел вращения движка. */
const FACETS = 48;

/** Конус (r, h) приближением: правильная N-угольная пирамида. */
export function coneApprox(r: number, h: number): Polyhedron {
  return pyramid(regularPolygon(FACETS, r, 0, 0), [0, 0, h]);
}

/** Объём приближения: используется только для ОТНОШЕНИЙ — тогда точен. */
export function approxVolume(r: number, h: number): number {
  return polyhedronVolume(coneApprox(r, h));
}

/** Площадь основания приближением: как и объём, годится для отношений. */
export function approxBaseArea(r: number): number {
  return polygonArea(regularPolygon(FACETS, r, 0, 0));
}

/** Площадь боковой поверхности приближением: сумма боковых граней. */
export function approxLateralArea(r: number, h: number): number {
  const body = coneApprox(r, h);
  return body.faces
    .slice(1)
    .reduce((sum, face) => sum + polygonArea(face.map((i) => body.vertices[i] as Vec3)), 0);
}

/** Полная площадь поверхности приближением: боковая плюс основание. */
export function approxTotalArea(r: number, h: number): number {
  return approxLateralArea(r, h) + approxBaseArea(r);
}

/** Точка на окружности основания настоящего конуса (r, h): угол в радианах. */
export function basePoint(r: number, angle: number): Vec3 {
  return [r * Math.cos(angle), r * Math.sin(angle), 0];
}

/** Вершина конуса (r, h) в тех же координатах, что и basePoint. */
export function apex(h: number): Vec3 {
  return [0, 0, h];
}

/**
 * Найти x ≥ 0, при котором f(x) = target, простым делением пополам.
 * Используется там, где формула ответа — короткая алгебра с корнем:
 * бисекция ищет то же число, но без формулы вообще, только через
 * измерение расстояния в реальных координатах на каждом шаге.
 */
export function solveBySearch(target: number, f: (x: number) => number): number {
  let lo = 0;
  let hi = 1;
  while (f(hi) < target) {
    hi *= 2;
  }
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}
