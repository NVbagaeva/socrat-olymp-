/**
 * Чертежи раздела V: цилиндр. Где в условии два сосуда — на чертеже
 * два цилиндра рядом; уровень жидкости заливкой, новый уровень
 * сечением. Букв нет — их нет и в условии.
 */

import { type Cylinder, type Model } from '../../solid/model';
import { circleSection } from '../../solid/drawings/common';
import type { Vec3 } from '../../solid/vec';

const R = 2.2;
const H = 4.4;

const cyl = (base: Vec3, r: number, h: number, extra: Partial<Cylinder> = {}): Cylinder => ({
  kind: 'cylinder',
  base,
  r,
  h,
  ...extra,
});

/** Цилиндр с высотой: ось показана вспомогательным отрезком. */
export function cylinderWithHeight(alt: string): Model {
  return {
    alt,
    bodies: [cyl([0, 0, 0], R, H)],
    lines: [{ a: [0, 0, 0], b: [0, 0, H] }],
  };
}

/** Сосуд с жидкостью и новым уровнем после погружения детали. */
export function vesselWithRise(alt: string, level: number, risen: number): Model {
  return {
    alt,
    bodies: [cyl([0, 0, 0], R, H, { liquid: level })],
    sections: [circleSection([0, 0, risen], R)],
  };
}

/** Два цилиндрических сосуда рядом: второй шире или уже. */
export function twoVessels(alt: string, ratio: number): Model {
  /* На чертеже разница в диаметрах показана, но не в масштабе условия:
     при «в 9 раз» второй сосуд стал бы неразличимо узким. */
  const r2 = ratio > 1 ? R * 1.8 : R * 0.55;
  const h2 = ratio > 1 ? H * 0.8 : H * 1.1;
  const gap = R + r2 + 1.2;
  return { alt, bodies: [cyl([0, 0, 0], R, H), cyl([gap, 0, 0], r2, h2)] };
}

/** Два цилиндра: у второго высота меньше, а радиус больше. */
export function twoCylinders(alt: string): Model {
  return {
    alt,
    bodies: [cyl([0, 0, 0], R, H), cyl([R + R * 1.7 + 1.2, 0, 0], R * 1.7, H / 2.2)],
  };
}

/** Две кружки: первая выше, вторая шире. */
export function twoMugs(alt: string): Model {
  return {
    alt,
    bodies: [
      cyl([0, 0, 0], R * 0.7, H * 1.25),
      cyl([R * 0.7 + R * 1.5 + 1.2, 0, 0], R * 1.5, H * 0.62),
    ],
  };
}
