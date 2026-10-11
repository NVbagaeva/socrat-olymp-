/**
 * Развёртка октаэдра от нижней вершины — общая для сцены и для проверки
 * scripts/check-intro-unfold.mjs, что грани нигде не проходят друг
 * сквозь друга.
 *
 * Октаэдр: центр (0, 1, 0), нижняя вершина B в начале координат.
 * Ромб k (k = 0…3, азимут 90°·k, 0 — к зрителю) — нижняя грань у B и
 * верхняя, примыкающая к ней по экваториальному ребру. Нижняя грань
 * поворачивается вокруг горизонтали через B, верхняя — вокруг общего
 * ребра; обе оси перпендикулярны радиальной плоскости ромба.
 */

import { OCTA_EDGE, OCTA_FACE_H, OCTA_FACE_TILT } from './geometry';
import { basis, cross, madd, scale, type Mat4, type Vec3 } from './math';
import { span, spring } from './timeline';

const DEG = Math.PI / 180;

/** Треугольники граней в своих плоскостях (x — поперёк, y — от B / от ребра сгиба). */
export const LOWER_TRI: [[number, number], [number, number], [number, number]] = [
  [0, 0],
  [OCTA_EDGE / 2, OCTA_FACE_H],
  [-OCTA_EDGE / 2, OCTA_FACE_H],
];
export const UPPER_TRI: [[number, number], [number, number], [number, number]] = [
  [-OCTA_EDGE / 2, 0],
  [OCTA_EDGE / 2, 0],
  [0, OCTA_FACE_H],
];

/** Наклоны граней к вертикали: собранный октаэдр и раскрытый. */
const FOLD_L = OCTA_FACE_TILT;
const FOLD_U = -OCTA_FACE_TILT;
/* Не меньше FOLD_L: иначе нижние грани заваливаются внутрь, друг в друга. */
const OPEN_L = 38 * DEG;
const OPEN_U = 50 * DEG;

/** Наклоны нижней и верхней граней в момент t. */
export function unfoldAngles(t: number): { aL: number; aU: number } {
  return {
    aL: FOLD_L + (OPEN_L - FOLD_L) * spring(span(t, 0.8, 2.0)),
    aU: FOLD_U + (OPEN_U - FOLD_U) * spring(span(t, 0.8, 1.9)),
  };
}

const UP: Vec3 = [0, 1, 0];

/** Матрицы нижней и верхней граней каждого ромба (в системе октаэдра). */
export function petalFrames(aL: number, aU: number): { lower: Mat4; upper: Mat4 }[] {
  const out: { lower: Mat4; upper: Mat4 }[] = [];
  for (let k = 0; k < 4; k += 1) {
    const phi = k * 90 * DEG;
    const radial: Vec3 = [Math.sin(phi), 0, Math.cos(phi)];
    const tangent: Vec3 = [Math.cos(phi), 0, -Math.sin(phi)];
    const dL = madd(scale(radial, Math.sin(aL)), UP, Math.cos(aL));
    const dU = madd(scale(radial, Math.sin(aU)), UP, Math.cos(aU));
    const hinge = scale(dL, OCTA_FACE_H);
    out.push({
      lower: basis(tangent, dL, cross(tangent, dL)),
      upper: basis(tangent, dU, cross(tangent, dU), hinge),
    });
  }
  return out;
}
