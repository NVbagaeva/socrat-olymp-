/**
 * Чертежи раздела VII: вписанный и описанный цилиндр.
 *
 * Комбинации тел: внешнее тело прозрачное (glass), внутреннее видно
 * сквозь него, видимость учитывает оба тела. Вид ортогональный.
 * Чисел на чертеже нет — их нет и в задачнике.
 */

import { box, prism } from '../../solid/figures';
import { type Model, type Polyhedron } from '../../solid/model';
import { unlabelled } from '../../solid/drawings/common';
import type { Vec3 } from '../../solid/vec';

export const R = 2.2;
export const H = 4.2;

/** Прямоугольный параллелепипед, описанный около цилиндра. */
export function boxAroundCylinder(alt: string, h: number): Model {
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
export function cylinderAroundPrism(alt: string): Model {
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
export function cylinderAndCone(alt: string, h: number): Model {
  return {
    alt,
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h, glass: true },
      { kind: 'cone', base: [0, 0, 0], r: R, h, hideBase: true },
    ],
  };
}
