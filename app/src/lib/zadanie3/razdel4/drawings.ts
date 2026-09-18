/**
 * Чертежи раздела IV: конус. Буквы не нужны — их нет и в условии.
 * Пропорции фиксированы для читаемости.
 */

import { type Cone, type Model } from '../../solid/model';
import { circleSection } from '../../solid/drawings/common';
import { ortho } from '../../solid/project';
import type { Vec3 } from '../../solid/vec';

const R = 2.5;
const H = 4.6;

const O: Vec3 = [0, 0, 0];
const S: Vec3 = [0, 0, H];

const cone = (extra: Partial<Cone> = {}): Cone => ({ kind: 'cone', base: O, r: R, h: H, ...extra });

/** Конус с высотой. */
export function coneWithHeight(alt: string): Model {
  return { alt, bodies: [cone()], lines: [{ a: S, b: O }] };
}

/** Конус с осевым сечением и высотой. */
export function coneWithAxial(alt: string): Model {
  return {
    alt,
    bodies: [cone()],
    lines: [{ a: S, b: O }],
    sections: [{ points: [S, ortho.circlePoint(O, R, 0), ortho.circlePoint(O, R, Math.PI)] }],
  };
}

/** Конус с сечением, параллельным основанию: доля высоты от вершины. */
export function coneWithParallelCut(alt: string, fromApex: number): Model {
  const center: Vec3 = [0, 0, H * (1 - fromApex)];
  return {
    alt,
    bodies: [cone()],
    lines: [{ a: S, b: O }],
    sections: [circleSection(center, R * fromApex)],
  };
}

/** Сосуд в форме конуса вершиной вниз с жидкостью до доли высоты. */
export function coneVessel(alt: string, fraction: number): Model {
  return {
    alt,
    bodies: [{ kind: 'cone', base: [0, 0, H], r: R, h: H, inverted: true, liquid: H * fraction }],
  };
}
