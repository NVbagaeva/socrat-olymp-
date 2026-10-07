/**
 * Многогранник: вершины, рёбра, грани.
 *
 * Описание не знает, куб это или пирамида: вершины с именами
 * и координатами, грани списками вершин. Рёбра выводятся из граней,
 * у каждого ребра — две соседние грани. Поэтому призмы, пирамиды
 * и тетраэдр добавляются новым сборщиком, без переделки ядра.
 *
 * Имена — в записи TeX: «A», «A_1». Координаты — точные дроби.
 */

import { type Rat, rat, ratDec } from './rational';
import { type Plane, type V3, collinear, planeThrough, sub, v3 } from './vec';

export interface Vertex {
  name: string;
  p: V3;
}

export interface Face {
  /** Имя грани в записи TeX без скобок: «AA_1B_1B». */
  name: string;
  /** Вершины по обходу против часовой стрелки, если смотреть снаружи. */
  idx: number[];
  plane: Plane;
}

export interface Edge {
  /** Индексы концов, a < b. */
  a: number;
  b: number;
  /** Индексы двух граней, которым принадлежит ребро. */
  faces: [number, number];
}

export interface Polyhedron {
  /** «cube», «box» — для подписей и формата заданий. */
  kind: string;
  vertices: Vertex[];
  faces: Face[];
  edges: Edge[];
}

/** Собрать многогранник: плоскости граней и рёбра считаются здесь. */
export function polyhedron(
  kind: string,
  vertices: Vertex[],
  faces: { name: string; idx: number[] }[],
): Polyhedron {
  const full: Face[] = faces.map((f) => {
    const [i, j, k] = f.idx;
    if (i === undefined || j === undefined || k === undefined) {
      throw new Error(`грань ${f.name}: меньше трёх вершин`);
    }
    const plane = planeThrough(at(vertices, i).p, at(vertices, j).p, at(vertices, k).p);
    if (plane === null) throw new Error(`грань ${f.name}: вершины на одной прямой`);
    return { name: f.name, idx: f.idx, plane };
  });
  const byKey = new Map<string, { a: number; b: number; faces: number[] }>();
  full.forEach((f, fi) => {
    f.idx.forEach((v, i) => {
      const w = f.idx[(i + 1) % f.idx.length] as number;
      const a = Math.min(v, w);
      const b = Math.max(v, w);
      const key = `${a}-${b}`;
      const e = byKey.get(key) ?? { a, b, faces: [] };
      e.faces.push(fi);
      byKey.set(key, e);
    });
  });
  const edges: Edge[] = [...byKey.values()].map((e) => {
    if (e.faces.length !== 2) {
      throw new Error(
        `ребро ${at(vertices, e.a).name}${at(vertices, e.b).name}: граней ${e.faces.length}`,
      );
    }
    return { a: e.a, b: e.b, faces: [e.faces[0] as number, e.faces[1] as number] };
  });
  return { kind, vertices, faces: full, edges };
}

function at<T>(xs: readonly T[], i: number): T {
  const x = xs[i];
  if (x === undefined) throw new Error(`индекс ${i} вне массива`);
  return x;
}

/** Число или дробь для параметров фигуры: 4, 2.5, rat(7, 3). */
export type Size = number | Rat;
const toRat = (x: Size): Rat => (typeof x === 'number' ? ratDec(x) : x);

/**
 * Прямоугольный параллелепипед ABCDA_1B_1C_1D_1: AB = a, AD = b,
 * AA_1 = c. Нижнее основание ABCD, A_1 над A. Оси: x вдоль AB,
 * y вдоль AD, z вдоль AA_1.
 */
export function box(a: Size, b: Size, c: Size, kind = 'box'): Polyhedron {
  const [x, y, z] = [toRat(a), toRat(b), toRat(c)];
  const o = rat(0);
  const P = (px: Rat, py: Rat, pz: Rat) => v3(px, py, pz);
  const vertices: Vertex[] = [
    { name: 'A', p: P(o, o, o) },
    { name: 'B', p: P(x, o, o) },
    { name: 'C', p: P(x, y, o) },
    { name: 'D', p: P(o, y, o) },
    { name: 'A_1', p: P(o, o, z) },
    { name: 'B_1', p: P(x, o, z) },
    { name: 'C_1', p: P(x, y, z) },
    { name: 'D_1', p: P(o, y, z) },
  ];
  const [A, B, C, D, A1, B1, C1, D1] = [0, 1, 2, 3, 4, 5, 6, 7];
  return polyhedron(kind, vertices, [
    { name: 'ABCD', idx: [A, D, C, B] },
    { name: 'A_1B_1C_1D_1', idx: [A1, B1, C1, D1] },
    { name: 'AA_1B_1B', idx: [A, B, B1, A1] },
    { name: 'BB_1C_1C', idx: [B, C, C1, B1] },
    { name: 'CC_1D_1D', idx: [C, D, D1, C1] },
    { name: 'AA_1D_1D', idx: [A, A1, D1, D] },
  ]);
}

/** Куб ABCDA_1B_1C_1D_1 с ребром a. */
export const cube = (a: Size): Polyhedron => box(a, a, a, 'cube');

export function vertexIndex(poly: Polyhedron, name: string): number {
  const i = poly.vertices.findIndex((v) => v.name === name);
  if (i < 0) throw new Error(`нет вершины ${name}`);
  return i;
}

export function edgeIndex(poly: Polyhedron, a: string, b: string): number {
  const ia = vertexIndex(poly, a);
  const ib = vertexIndex(poly, b);
  const i = poly.edges.findIndex((e) => (e.a === ia && e.b === ib) || (e.a === ib && e.b === ia));
  if (i < 0) throw new Error(`нет ребра ${a}${b}`);
  return i;
}

export function faceIndex(poly: Polyhedron, name: string): number {
  const i = poly.faces.findIndex((f) => f.name === name);
  if (i < 0) throw new Error(`нет грани ${name}`);
  return i;
}

/** Имя ребра в TeX: «AA_1». */
export const edgeName = (poly: Polyhedron, e: Edge): string =>
  `${at(poly.vertices, e.a).name}${at(poly.vertices, e.b).name}`;

/** Направление ребра — проверка, что фигура не вырождена. */
export const edgeDir = (poly: Polyhedron, e: Edge): V3 =>
  sub(at(poly.vertices, e.b).p, at(poly.vertices, e.a).p);

/** Параллельны ли два ребра. */
export const parallelEdges = (poly: Polyhedron, e: Edge, f: Edge): boolean =>
  collinear(edgeDir(poly, e), edgeDir(poly, f));

export { at };
