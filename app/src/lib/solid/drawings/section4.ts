/**
 * Раздел IV. Конус: прототипы P03-52 … P03-62.
 *
 * Как в задачнике: букв на чертеже нет, потому что их нет в условии.
 * Показана высота, а сечение — там, где о сечении и спрашивают.
 */

import { type Cone, type Model } from '../model';
import { circleSection } from './common';
import { ortho } from '../project';
import type { Vec3 } from '../vec';

const R = 2.5;
const H = 4.6;

const O: Vec3 = [0, 0, 0];
const S: Vec3 = [0, 0, H];

const cone = (extra: Partial<Cone> = {}): Cone => ({ kind: 'cone', base: O, r: R, h: H, ...extra });

/** Конус с высотой. */
function coneWithHeight(alt: string): Model {
  return { alt, bodies: [cone()], lines: [{ a: S, b: O }] };
}

/** Конус с осевым сечением и высотой. */
function coneWithAxial(alt: string): Model {
  return {
    alt,
    bodies: [cone()],
    lines: [{ a: S, b: O }],
    sections: [{ points: [S, ortho.circlePoint(O, R, 0), ortho.circlePoint(O, R, Math.PI)] }],
  };
}

/** Конус с сечением, параллельным основанию: доля высоты от вершины. */
function coneWithParallelCut(alt: string, fromApex: number): Model {
  const center: Vec3 = [0, 0, H * (1 - fromApex)];
  return {
    alt,
    bodies: [cone()],
    lines: [{ a: S, b: O }],
    sections: [circleSection(center, R * fromApex)],
  };
}

export const SECTION4: Record<string, Model> = {
  'P03-52': coneWithHeight('Конус с высотой: даны высота и диаметр основания'),
  'P03-53': coneWithHeight('Конус с высотой: даны высота и образующая'),
  'P03-54': coneWithHeight('Конус с высотой: даны диаметр основания и образующая'),

  'P03-55': coneWithAxial('Конус с осевым сечением и высотой'),
  'P03-56': coneWithAxial('Конус с осевым сечением и высотой'),
  'P03-57': coneWithAxial('Конус с осевым сечением и высотой'),

  'P03-58': coneWithParallelCut(
    'Конус, сечение плоскостью, параллельной основанию: она делит высоту в отношении 4 к 12, считая от вершины',
    4 / 16,
  ),

  'P03-59': coneWithHeight('Конус с высотой: радиус основания увеличивают, высота остаётся'),
  'P03-60': coneWithHeight('Конус с высотой: высоту уменьшают, радиус основания остаётся'),

  'P03-61': {
    alt: 'Сосуд в форме конуса, вершиной вниз: уровень жидкости достигает четверти высоты сосуда',
    bodies: [{ kind: 'cone', base: [0, 0, H], r: R, h: H, inverted: true, liquid: H / 4 }],
  },

  'P03-62': coneWithParallelCut(
    'Конус, сечение плоскостью, параллельной основанию: она делит высоту в отношении 3 к 2, считая от вершины',
    3 / 5,
  ),
};
