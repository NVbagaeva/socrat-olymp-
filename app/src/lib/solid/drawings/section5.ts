/**
 * Раздел V. Цилиндр: прототипы P03-63 … P03-70.
 *
 * Где в условии два сосуда — на чертеже два цилиндра рядом.
 * Уровень жидкости — заливкой, новый уровень — сечением.
 */

import { type Cylinder, type Model } from '../model';
import { circleSection } from './common';
import type { Vec3 } from '../vec';

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
function cylinderWithHeight(alt: string): Model {
  return {
    alt,
    bodies: [cyl([0, 0, 0], R, H)],
    lines: [{ a: [0, 0, 0], b: [0, 0, H] }],
  };
}

/** Сосуд с жидкостью и новым уровнем после погружения детали. */
function vesselWithRise(alt: string, level: number, risen: number): Model {
  return {
    alt,
    bodies: [cyl([0, 0, 0], R, H, { liquid: level })],
    sections: [circleSection([0, 0, risen], R)],
  };
}

/** Два цилиндрических сосуда рядом: второй шире или уже. */
function twoVessels(alt: string, r2: number, h2: number): Model {
  const gap = R + r2 + 1.2;
  return { alt, bodies: [cyl([0, 0, 0], R, H), cyl([gap, 0, 0], r2, h2)] };
}

export const SECTION5: Record<string, Model> = {
  'P03-63': cylinderWithHeight('Цилиндр с высотой: даны боковая поверхность и высота'),
  'P03-64': cylinderWithHeight('Цилиндр с высотой: даны боковая поверхность и диаметр основания'),

  'P03-65': vesselWithRise(
    'Цилиндрический сосуд с водой: показан уровень жидкости и уровень после погружения детали',
    2.2,
    3.6,
  ),
  'P03-66': vesselWithRise(
    'Цилиндрический сосуд с водой: показан уровень жидкости и уровень после погружения детали',
    2.6,
    3.4,
  ),

  'P03-67': twoVessels('Два цилиндрических сосуда: у второго диаметр больше', R * 1.8, H * 0.8),
  'P03-68': twoVessels('Два цилиндрических сосуда: у второго диаметр меньше', R * 0.55, H * 1.1),

  'P03-69': {
    alt: 'Два цилиндра: у второго высота меньше, а радиус основания больше',
    bodies: [cyl([0, 0, 0], R, H), cyl([R + R * 1.7 + 1.2, 0, 0], R * 1.7, H / 2.2)],
  },

  'P03-70': {
    alt: 'Две цилиндрические кружки: первая выше, вторая шире',
    bodies: [
      cyl([0, 0, 0], R * 0.7, H * 1.25),
      cyl([R * 0.7 + R * 1.5 + 1.2, 0, 0], R * 1.5, H * 0.62),
    ],
  },
};
