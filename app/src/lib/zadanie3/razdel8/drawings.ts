/**
 * Чертежи раздела VIII: вписанная и описанная сфера.
 *
 * Комбинации тел, вид ортогональный. Параллелепипед, описанный около
 * сферы, — это куб: сфера касается всех шести граней только тогда,
 * когда рёбра равны, и на этом построена сама задача. Чисел на
 * чертеже нет — их нет и в задачнике.
 */

import { box } from '../../solid/figures';
import { unlabelled } from '../../solid/drawings/common';
import { type Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

const A = 4;
const R = 2.2;

/** Шар, вписанный в куб. */
export function ballInCube(alt: string): Model {
  const cube = unlabelled(box(A, A, A));
  cube.glass = true;
  const center: Vec3 = [A / 2, A / 2, A / 2];
  return { alt, bodies: [cube, { kind: 'sphere', center, r: A / 2 }] };
}

/** Шар, вписанный в цилиндр: высота цилиндра равна диаметру шара. */
export function ballInCylinder(alt: string): Model {
  const center: Vec3 = [0, 0, R];
  return {
    alt,
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h: 2 * R, glass: true },
      { kind: 'sphere', center, r: R },
    ],
  };
}

/**
 * Сфера и конус: сфера содержит окружность основания конуса и его
 * вершину, а её центр — центр основания. Тогда радиус основания конуса
 * и его высота равны радиусу сферы.
 */
export function sphereAroundCone(alt: string): Model {
  const O: Vec3 = [0, 0, 0];
  return {
    alt,
    bodies: [
      { kind: 'sphere', center: O, r: R, glass: true },
      { kind: 'cone', base: O, r: R, h: R },
    ],
  };
}
