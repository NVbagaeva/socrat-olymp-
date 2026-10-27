/**
 * «Ступенька» — многогранник, все двугранные углы которого прямые:
 * высокий блок слева и низкий справа, вытянутые в глубину. Профиль в
 * плоскости xz, глубина — по y, ось z — вверх (как у lib/solid).
 *
 * Имена вершин: снизу ABCD (как у параллелепипеда), верх высокого
 * блока — A₂B₂C₂D₂, уступ — B₁C₁ и K, L. Подписаны только те, что
 * нужны задаче (podpisi).
 */

import { faceNormal, type Polyhedron } from '../solid/model';
import { type Vec3, at, dot } from '../solid/vec';

export interface Stupenka {
  /** Вся ширина. */
  W: number;
  /** Ширина высокого блока. */
  w: number;
  /** Высота высокого блока. */
  H: number;
  /** Высота низкого блока. */
  h: number;
  /** Глубина. */
  D: number;
}

/** Вершины по именам: профиль спереди (y = 0) и сзади (y = D). */
export function vershinyStupenki(s: Stupenka): Record<string, Vec3> {
  const { W, w, H, h, D } = s;
  return {
    A: [0, 0, 0],
    B: [W, 0, 0],
    B1: [W, 0, h],
    K: [w, 0, h],
    B2: [w, 0, H],
    A2: [0, 0, H],
    D: [0, D, 0],
    C: [W, D, 0],
    C1: [W, D, h],
    L: [w, D, h],
    C2: [w, D, H],
    D2: [0, D, H],
  };
}

const PERED = ['A', 'B', 'B1', 'K', 'B2', 'A2'];
const ZAD = ['D', 'C', 'C1', 'L', 'C2', 'D2'];

/**
 * Тело ступеньки. Грани ориентированы наружу по нормали ребра профиля:
 * тело невыпуклое, и по центру ориентацию не определить.
 */
export function teloStupenki(s: Stupenka, podpisi: readonly string[] = []): Polyhedron {
  const v = vershinyStupenki(s);
  const imena = [...PERED, ...ZAD];
  const vertices = imena.map((name) => v[name] as Vec3);
  const n = PERED.length;
  const flat: [number, number][] = PERED.map((name) => {
    const p = v[name] as Vec3;
    return [p[0], p[2]];
  });
  const front = Array.from({ length: n }, (_, i) => i).reverse();
  const back = Array.from({ length: n }, (_, i) => n + i);
  const faces: number[][] = [];
  /* Передняя грань смотрит к −y, задняя — к +y. */
  faces.push(dot(faceNormal(vertices, front), [0, -1, 0]) > 0 ? front : front.slice().reverse());
  faces.push(dot(faceNormal(vertices, back), [0, 1, 0]) > 0 ? back : back.slice().reverse());
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const a = at(flat, i);
    const b = at(flat, j);
    const outward: Vec3 = [b[1] - a[1], 0, -(b[0] - a[0])];
    const quad = [i, j, n + j, n + i];
    faces.push(dot(faceNormal(vertices, quad), outward) > 0 ? quad : quad.slice().reverse());
  }
  return {
    kind: 'polyhedron',
    vertices,
    faces,
    names: imena.map((name) => (podpisi.includes(name) ? name : null)),
  };
}
