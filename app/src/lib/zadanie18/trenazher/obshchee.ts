/**
 * Общее для чертежей задач тренажёра №18. Сцены строятся так же, как
 * у опорных задач (lib/zadanie18/opornye/obshchee.ts, scena()):
 * исходное положение — данные пункта б), «Случайное положение» —
 * другая фигура из условия, на которой верно утверждение пункта а).
 */

import type { T2 } from '@/lib/skhemy/tipy';

export {
  delit,
  goditsyaTreugolnik,
  naOsnovanie,
  parametry,
  scena,
  signedS,
  vPromezhutke,
} from '../opornye/obshchee';

/** Треугольник по трём сторонам: B(0; 0), C(a; 0), A сверху. a = BC, b = CA, c = AB. */
export function poStoronam(a: number, b: number, c: number): Record<'A' | 'B' | 'C', T2> {
  const x = (c * c - b * b + a * a) / (2 * a);
  return { A: [x, Math.sqrt(Math.max(0, c * c - x * x))], B: [0, 0], C: [a, 0] };
}

/** Треугольник по двум сторонам и углу между ними (градусы): A(0; 0), B на оси x. */
export function poDvumStoronam(ab: number, ac: number, ugolA: number): Record<'A' | 'B' | 'C', T2> {
  const u = (ugolA * Math.PI) / 180;
  return { A: [0, 0], B: [ab, 0], C: [ac * Math.cos(u), ac * Math.sin(u)] };
}

/** Точка окружности с центром c и радиусом r под углом u (градусы). */
export function naOkr(c: T2, r: number, u: number): T2 {
  const v = (u * Math.PI) / 180;
  return [c[0] + r * Math.cos(v), c[1] + r * Math.sin(v)];
}
