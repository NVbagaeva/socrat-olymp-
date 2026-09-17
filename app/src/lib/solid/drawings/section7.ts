/**
 * Раздел VII. Вписанный и описанный цилиндр: прототипы P03-74 … P03-80.
 *
 * Комбинации тел: внешнее тело прозрачное (glass), внутреннее видно
 * сквозь него, видимость учитывает оба тела. Вид ортогональный.
 */

import { box, prism } from '../figures';
import { type Model, type Polyhedron } from '../model';
import { unlabelled } from './common';
import type { Vec3 } from '../vec';

const R = 2.2;
const H = 4.2;

/** Прямоугольный параллелепипед, описанный около цилиндра. */
function boxAroundCylinder(alt: string, h: number): Model {
  const body: Polyhedron = unlabelled(box(2 * R, 2 * R, h));
  body.glass = true;
  return {
    alt,
    bodies: [body, { kind: 'cylinder', base: [R, R, 0], r: R, h }],
  };
}

/**
 * Цилиндр, описанный около прямой призмы с прямоугольным треугольником
 * в основании: центр описанной окружности — середина гипотенузы.
 */
function cylinderAroundPrism(alt: string): Model {
  const a = 3.4;
  const b = 2.8;
  const base: Vec3[] = [
    [0, 0, 0],
    [a, 0, 0],
    [0, b, 0],
  ];
  const body = prism(base, [0, 0, H]);
  body.names = [null, null, null, null, null, null];
  body.noFill = true;
  const center: Vec3 = [a / 2, b / 2, 0];
  return {
    alt,
    bodies: [{ kind: 'cylinder', base: center, r: Math.hypot(a, b) / 2, h: H, glass: true }, body],
  };
}

/** Цилиндр и конус с общим основанием и высотой. */
function cylinderAndCone(alt: string, h: number): Model {
  return {
    alt,
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h, glass: true },
      { kind: 'cone', base: [0, 0, 0], r: R, h, hideBase: true },
    ],
  };
}

export const SECTION7: Record<string, Model> = {
  'P03-74': boxAroundCylinder(
    'Прямоугольный параллелепипед, описанный около цилиндра: радиус основания и высота цилиндра равны',
    2 * R,
  ),
  'P03-75': boxAroundCylinder('Прямоугольный параллелепипед, описанный около цилиндра', H),
  'P03-76': cylinderAroundPrism(
    'Цилиндр, описанный около прямой призмы с прямоугольным треугольником в основании',
  ),
  'P03-77': cylinderAndCone('Цилиндр и конус с общим основанием и общей высотой', H),
  'P03-78': cylinderAndCone('Цилиндр и конус с общим основанием и общей высотой', H),
  'P03-79': cylinderAndCone(
    'Цилиндр и конус с общим основанием и общей высотой; высота цилиндра равна радиусу основания',
    R,
  ),
  'P03-80': cylinderAndCone(
    'Цилиндр и конус с общим основанием и общей высотой; высота цилиндра равна радиусу основания',
    R,
  ),
};
