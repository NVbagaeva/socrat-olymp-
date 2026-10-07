/**
 * Сечение многогранника плоскостью — точно.
 *
 * Каждое ребро пересекается с плоскостью по знакам концов (n·X − c):
 * разные знаки — точка внутри ребра, ноль — вершина в плоскости.
 * Точки упорядочиваются обходом выпуклого многоугольника по углу
 * вокруг центра, причём углы сравниваются точно (полуплоскость
 * и знак векторного произведения), а не через atan2.
 */

import { type Polyhedron, at, edgeName } from './polyhedron';
import { type Rat, ONE, div, eq, isZero, rat, sign, sub as rsub } from './rational';
import { type Plane, type V3, add, cross, dot, lerp, scale, side, sub } from './vec';

export interface SectionVertex {
  p: V3;
  /** Вершина многогранника, если точка с ней совпала. */
  vertex?: number;
  /** Ребро и параметр t от первого конца (0 < t < 1), если точка внутри ребра. */
  edge?: number;
  t?: Rat;
  /** Грани, которым принадлежит точка (по ним идут стороны сечения). */
  faces: number[];
}

export interface Section {
  /** Упорядоченные вершины выпуклого многоугольника. */
  vertices: SectionVertex[];
  /**
   * 'polygon' — обычное сечение; 'face' — плоскость содержит грань;
   * 'touch' — касание по вершине или ребру; 'none' — не пересекает.
   */
  kind: 'polygon' | 'face' | 'touch' | 'none';
  /** Для 'face' — индекс грани. */
  face?: number;
}

/** Сечение многогранника плоскостью. */
export function section(poly: Polyhedron, pl: Plane): Section {
  const s = poly.vertices.map((v) => sign(side(pl, v.p)));
  // Плоскость содержит грань целиком.
  const faceIn = poly.faces.findIndex((f) => f.idx.every((i) => s[i] === 0));
  if (faceIn >= 0) {
    const f = at(poly.faces, faceIn);
    return {
      kind: 'face',
      face: faceIn,
      vertices: f.idx.map((i) => ({
        p: at(poly.vertices, i).p,
        vertex: i,
        faces: facesOfVertex(poly, i),
      })),
    };
  }
  const pts: SectionVertex[] = [];
  poly.vertices.forEach((v, i) => {
    if (s[i] === 0) pts.push({ p: v.p, vertex: i, faces: facesOfVertex(poly, i) });
  });
  poly.edges.forEach((e, ei) => {
    const sa = s[e.a];
    const sb = s[e.b];
    if (sa === undefined || sb === undefined || sa === 0 || sb === 0 || sa === sb) return;
    const pa = at(poly.vertices, e.a).p;
    const pb = at(poly.vertices, e.b).p;
    const da = side(pl, pa);
    const db = side(pl, pb);
    const t = div(da, rsub(da, db));
    pts.push({ p: lerp(pa, pb, t), edge: ei, t, faces: [...e.faces] });
  });
  if (pts.length === 0) return { kind: 'none', vertices: [] };
  if (pts.length < 3) return { kind: 'touch', vertices: pts };
  return { kind: 'polygon', vertices: orderConvex(pts, pl) };
}

function facesOfVertex(poly: Polyhedron, i: number): number[] {
  return poly.faces.flatMap((f, fi) => (f.idx.includes(i) ? [fi] : []));
}

/** Обход выпуклого многоугольника в плоскости pl: точно, по полуплоскостям. */
export function orderConvex<T extends { p: V3 }>(pts: T[], pl: Plane): T[] {
  const n = pts.length;
  let g = pts[0]?.p;
  if (g === undefined) return [];
  for (let i = 1; i < n; i++) g = add(g, at(pts, i).p);
  g = scale(g, rat(1, n));
  const u = sub(at(pts, 0).p, g);
  const w = cross(pl.n, u);
  const key = (p: V3) => {
    const v = sub(p, g as V3);
    return { x: dot(v, u), y: dot(v, w) };
  };
  const half = (x: Rat, y: Rat) => (sign(y) > 0 || (isZero(y) && sign(x) > 0) ? 0 : 1);
  return [...pts].sort((A, B) => {
    const a = key(A.p);
    const b = key(B.p);
    const ha = half(a.x, a.y);
    const hb = half(b.x, b.y);
    if (ha !== hb) return ha - hb;
    // Векторное произведение a × b > 0 — a раньше по ходу.
    const c = rsub(mulR(a.x, b.y), mulR(a.y, b.x));
    return -sign(c);
  });
}

const mulR = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);

/** Делит ли плоскость ребро и в каком отношении (от первого конца ребра). */
export interface EdgeCut {
  edge: number;
  /** Имя ребра «CC_1». */
  name: string;
  t: Rat;
  /** Отношение отрезков от первого конца: p : q, целые. */
  p: bigint;
  q: bigint;
}

export function edgeCuts(poly: Polyhedron, sec: Section): EdgeCut[] {
  return sec.vertices.flatMap((v) => {
    if (v.edge === undefined || v.t === undefined) return [];
    const e = at(poly.edges, v.edge);
    const rest = rsub(ONE, v.t);
    // t : (1 − t) = (t.n·rest.d) : (rest.n·t.d), сокращаем.
    let p = v.t.n * rest.d;
    let q = rest.n * v.t.d;
    const g = gcdB(p, q);
    p /= g;
    q /= g;
    return [{ edge: v.edge, name: edgeName(poly, e), t: v.t, p, q }];
  });
}

function gcdB(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x || 1n;
}

/* ── Вид многоугольника ─────────────────────────────────────── */

export type PolygonKind =
  | 'треугольник'
  | 'равнобедренный треугольник'
  | 'равносторонний треугольник'
  | 'прямоугольный треугольник'
  | 'четырёхугольник'
  | 'трапеция'
  | 'равнобедренная трапеция'
  | 'параллелограмм'
  | 'прямоугольник'
  | 'ромб'
  | 'квадрат'
  | 'пятиугольник'
  | 'шестиугольник'
  | 'правильный шестиугольник';

const side2 = (a: V3, b: V3): Rat => dot(sub(b, a), sub(b, a));
const parallel = (a: V3, b: V3, c: V3, d: V3) => {
  const x = cross(sub(b, a), sub(d, c));
  return isZero(x.x) && isZero(x.y) && isZero(x.z);
};

export function polygonKind(pts: V3[]): PolygonKind {
  const n = pts.length;
  const P = (i: number) => at(pts, ((i % n) + n) % n);
  const sides = pts.map((_, i) => side2(P(i), P(i + 1)));
  const allEq = sides.every((x) => eq(x, at(sides, 0)));
  const rightAt = (i: number) => isZero(dot(sub(P(i - 1), P(i)), sub(P(i + 1), P(i))));
  if (n === 3) {
    if (allEq) return 'равносторонний треугольник';
    if ([0, 1, 2].some(rightAt)) return 'прямоугольный треугольник';
    const [a, b, c] = sides as [Rat, Rat, Rat];
    if (eq(a, b) || eq(b, c) || eq(a, c)) return 'равнобедренный треугольник';
    return 'треугольник';
  }
  if (n === 4) {
    const p1 = parallel(P(0), P(1), P(3), P(2));
    const p2 = parallel(P(1), P(2), P(0), P(3));
    if (p1 && p2) {
      const right = rightAt(0);
      if (allEq) return right ? 'квадрат' : 'ромб';
      return right ? 'прямоугольник' : 'параллелограмм';
    }
    if (p1 || p2) {
      // Боковые стороны — непараллельная пара.
      const legs = p1 ? [at(sides, 1), at(sides, 3)] : [at(sides, 0), at(sides, 2)];
      return eq(legs[0] as Rat, legs[1] as Rat) ? 'равнобедренная трапеция' : 'трапеция';
    }
    return 'четырёхугольник';
  }
  if (n === 5) return 'пятиугольник';
  if (n === 6) {
    const angles = pts.map((_, i) => dot(sub(P(i - 1), P(i)), sub(P(i + 1), P(i))));
    const regular = allEq && angles.every((x) => eq(x, at(angles, 0)));
    return regular ? 'правильный шестиугольник' : 'шестиугольник';
  }
  return 'шестиугольник';
}
