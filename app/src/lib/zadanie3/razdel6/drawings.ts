/**
 * Чертежи раздела VI: шар.
 *
 * В условии речь о двух шарах, поэтому на чертеже два шара рядом.
 * Отношение радиусов на чертеже показано, а не вычислено по условию:
 * при отношении девять к одному второй шар выродился бы в точку.
 * Чисел на чертеже нет — их нет и в задачнике.
 */

import { type Model, type Sphere } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

const ball = (center: Vec3, r: number): Sphere => ({ kind: 'sphere', center, r });

/** Два шара рядом: радиусы в том отношении, какое читается. */
export function twoBalls(alt: string, r1: number, r2: number): Model {
  const gap = r1 + r2 + 0.8;
  return { alt, bodies: [ball([0, 0, 0], r1), ball([gap, 0, 0], r2)] };
}
