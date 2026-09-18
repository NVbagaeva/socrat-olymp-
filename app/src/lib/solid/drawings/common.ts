/**
 * Общее для чертежей банка.
 *
 * Выделенные элементы задачи рисуются так же, как в задачнике:
 * прямые и диагонали — вспомогательными отрезками (терракотовые,
 * штриховые там, где скрыты), сечения и части тела — заливкой сечения.
 * Числа на чертеже есть только там, где они есть в задачнике.
 */

import { type Line, type Model, type Polyhedron, type Section } from '../model';
import { vertex } from '../figures';
import { ortho } from '../project';
import type { Vec3 } from '../vec';

/** Чертёж банка: модель плюс то, к чему она относится. */
export interface Drawing {
  /** id прототипа (P03-01), шпаргалки (sheet-I-1) или миниатюры (thumb-I). */
  id: string;
  /** Номер варианта для прототипов с числами на чертеже. */
  variant?: number;
  model: Model;
}

/**
 * Снять подписи вершин. В задачнике буквы стоят только там, где они
 * есть в условии; на остальных чертежах фигура без букв.
 */
export function unlabelled(body: Polyhedron): Polyhedron {
  body.names = body.vertices.map(() => null);
  return body;
}

/** Точки многогранника по именам вершин: «A», «B1». */
export function at(body: Polyhedron, ...names: string[]): Vec3[] {
  return names.map((name) => vertex(body, name));
}

/** Отрезок между вершинами. */
export function edge(body: Polyhedron, from: string, to: string, label?: string): Line {
  const line: Line = { a: vertex(body, from), b: vertex(body, to) };
  return label === undefined ? line : { ...line, label };
}

/** Сечение или выделенная часть по вершинам, в порядке обхода. */
export function face(body: Polyhedron, ...names: string[]): Section {
  return { points: at(body, ...names) };
}

/** Та же точка на высоте z: для вертикальных сечений. */
export function lift(p: Vec3, z: number): Vec3 {
  return [p[0], p[1], z];
}

/** Середина ребра. */
export function midEdge(body: Polyhedron, from: string, to: string): Vec3 {
  const a = vertex(body, from);
  const b = vertex(body, to);
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

/**
 * Горизонтальное сечение тела вращения: окружность радиуса r
 * на высоте центра. Рисуется как сечение — заливкой и контуром.
 */
export function circleSection(center: Vec3, r: number, steps = 96): Section {
  return {
    points: Array.from({ length: steps }, (_, k) =>
      ortho.circlePoint(center, r, (2 * Math.PI * k) / steps),
    ),
  };
}

/** Модель призмы или параллелепипеда: их вид — кабинетный. */
export function prismModel(alt: string, body: Polyhedron, rest: Partial<Model> = {}): Model {
  return { alt, view: 'cabinet', bodies: [body], ...rest };
}

/** Модель пирамиды, тела вращения или комбинации: вид ортогональный. */
export function bodyModel(alt: string, model: Omit<Model, 'alt' | 'view'>): Model {
  return { alt, ...model };
}
