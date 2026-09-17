/**
 * Раздел VIII. Вписанная и описанная сфера: прототипы P03-81 … P03-91.
 *
 * Комбинации тел, вид ортогональный. Параллелепипед, описанный около
 * сферы, — это куб: сфера касается всех шести граней только тогда,
 * когда рёбра равны, и на этом построена сама задача.
 */

import { box } from '../figures';
import { unlabelled } from './common';
import { type Model } from '../model';
import type { Vec3 } from '../vec';

const A = 4;
const R = 2.2;

/** Шар, вписанный в куб. */
function ballInCube(alt: string): Model {
  const cube = unlabelled(box(A, A, A));
  cube.glass = true;
  const center: Vec3 = [A / 2, A / 2, A / 2];
  return { alt, bodies: [cube, { kind: 'sphere', center, r: A / 2 }] };
}

/** Шар, вписанный в цилиндр: высота цилиндра равна диаметру шара. */
function ballInCylinder(alt: string): Model {
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
function sphereAroundCone(alt: string): Model {
  const O: Vec3 = [0, 0, 0];
  return {
    alt,
    bodies: [
      { kind: 'sphere', center: O, r: R, glass: true },
      { kind: 'cone', base: O, r: R, h: R },
    ],
  };
}

export const SECTION8: Record<string, Model> = {
  'P03-81': ballInCube('Шар, вписанный в куб'),
  'P03-82': ballInCube('Куб, описанный около сферы'),
  'P03-83': ballInCube('Прямоугольный параллелепипед, описанный около сферы: он оказывается кубом'),
  'P03-84': ballInCylinder('Шар, вписанный в цилиндр'),
  'P03-85': ballInCylinder('Шар, вписанный в цилиндр'),
  'P03-86': ballInCylinder('Цилиндр, описанный около шара'),
  'P03-87': ballInCylinder('Шар, вписанный в цилиндр'),
  'P03-88': sphereAroundCone('Сфера, описанная около конуса: центр сферы — центр основания конуса'),
  'P03-89': sphereAroundCone('Сфера, описанная около конуса: центр сферы — центр основания конуса'),
  'P03-90': sphereAroundCone('Конус, вписанный в шар: радиус основания конуса равен радиусу шара'),
  'P03-91': sphereAroundCone('Конус, вписанный в шар: радиус основания конуса равен радиусу шара'),
};
