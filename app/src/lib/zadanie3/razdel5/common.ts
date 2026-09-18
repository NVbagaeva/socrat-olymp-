/**
 * Общее для прототипов раздела V (цилиндр).
 *
 * У цилиндра, как и у конуса, точные объём и боковая поверхность
 * содержат π, и второго способа посчитать их с нуля нет. Поэтому
 * проверка здесь устроена так же, как в разделе IV: цилиндр
 * приближается правильной 48-угольной призмой, а сравниваются не
 * абсолютные значения, а ОТНОШЕНИЯ — доля объёма, во сколько раз,
 * какой высоте отвечает та же жидкость. Погрешность приближения
 * одинакова у всех тел семейства и в отношении сокращается без
 * остатка, поэтому совпадение получается точным, а не близким.
 *
 * Все ответы раздела — либо отношения, либо величины, выраженные
 * через отношение к «единичному» цилиндру, поэтому этого хватает.
 */

import { regularPolygon, rightPrism } from '../../solid/figures';
import { polygonArea, polyhedronVolume } from '../../solid/measure';
import { type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

/** Граней в приближении цилиндра призмой: как и у остальных тел вращения. */
const FACETS = 48;

/** Цилиндр (r, h) приближением: правильная N-угольная призма. */
export function prismApprox(r: number, h: number): Polyhedron {
  return rightPrism(regularPolygon(FACETS, r, 0, 0), h);
}

/** Объём приближения: годится для отношений, и только для них. */
export function approxVolume(r: number, h: number): number {
  return polyhedronVolume(prismApprox(r, h));
}

/** Боковая поверхность приближения: сумма боковых граней, без оснований. */
export function approxLateralArea(r: number, h: number): number {
  const body = prismApprox(r, h);
  return body.faces
    .slice(2)
    .reduce((sum, face) => sum + polygonArea(face.map((i) => body.vertices[i] as Vec3)), 0);
}

/**
 * Боковая поверхность в долях от боковой поверхности единичного
 * цилиндра. У точного цилиндра это ровно r·h, но здесь число
 * получено измерением граней настоящей призмы, а не формулой 2πrh.
 */
export function lateralUnits(r: number, h: number): number {
  return approxLateralArea(r, h) / approxLateralArea(1, 1);
}

/** Объём в долях от объёма единичного цилиндра: у точного это r²h. */
export function volumeUnits(r: number, h: number): number {
  return approxVolume(r, h) / approxVolume(1, 1);
}

export { solveBySearch } from '../search';
