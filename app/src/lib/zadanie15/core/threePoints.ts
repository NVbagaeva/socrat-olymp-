/**
 * Сечение по трём точкам — точно.
 *
 * Ученик выбирает три точки на рёбрах или гранях. Здесь:
 *   — где точка на поверхности (вершина, ребро с параметром, грань)
 *     или что она не на поверхности;
 *   — проверки с текстом для ученика: точки разные, не на одной
 *     прямой, лежат на поверхности;
 *   — плоскость и сечение (section.ts: пересечения со всеми рёбрами,
 *     вершины без дублей — точно, обход в самой плоскости);
 *   — вырожденные случаи: плоскость совпадает с гранью, касается
 *     тела в вершине или по ребру, не пересекает его.
 *
 * buildThreePointSection делает то же внутри построения: плоскость —
 * объект plane3 с происхождением, новые вершины сечения — точки на
 * рёбрах со следующими свободными именами. Из этого потом строятся
 * пошаговое построение и обоснования (см. README).
 */

import { type Construction, type ObjId, type PointObj, type Result, inFace } from './construction';
import { type Polyhedron, at, edgeName } from './polyhedron';
import { type Rat, rat, sign } from './rational';
import { type Section, type SectionVertex, section } from './section';
import {
  type Plane,
  type V3,
  add,
  lerp,
  paramOn,
  planeThrough,
  scale,
  side,
  sub,
  veq,
} from './vec';

/** Где точка на поверхности многогранника. */
export type SurfacePlace =
  | { kind: 'vertex'; vertex: number }
  /** Внутри ребра: t от первого конца ребра, 0 < t < 1. */
  | { kind: 'edge'; edge: number; t: Rat }
  /** Внутри грани (не на её сторонах). */
  | { kind: 'face'; face: number };

/** Внутренняя точка выпуклого тела: центр масс вершин. */
function inner(poly: Polyhedron): V3 {
  let s = at(poly.vertices, 0).p;
  for (let i = 1; i < poly.vertices.length; i++) s = add(s, at(poly.vertices, i).p);
  return scale(s, rat(1, poly.vertices.length));
}

/**
 * Положение точки на поверхности выпуклого многогранника; null —
 * точка внутри тела или снаружи. Всё точно: точка не дальше границы
 * ни одной грани и лежит хотя бы в одной из них.
 */
export function placeOnSurface(poly: Polyhedron, p: V3): SurfacePlace | null {
  const c = inner(poly);
  const on: number[] = [];
  for (let fi = 0; fi < poly.faces.length; fi++) {
    const pl = at(poly.faces, fi).plane;
    const sp = sign(side(pl, p));
    if (sp === 0) {
      on.push(fi);
      continue;
    }
    // По другую сторону грани, чем центр, — снаружи.
    if (sp !== sign(side(pl, c))) return null;
  }
  if (on.length === 0) return null;
  const vi = poly.vertices.findIndex((v) => veq(v.p, p));
  if (vi >= 0) return { kind: 'vertex', vertex: vi };
  if (on.length >= 2) {
    const ei = poly.edges.findIndex((e) => on.includes(e.faces[0]) && on.includes(e.faces[1]));
    if (ei >= 0) {
      const e = at(poly.edges, ei);
      return {
        kind: 'edge',
        edge: ei,
        t: paramOn(at(poly.vertices, e.a).p, at(poly.vertices, e.b).p, p),
      };
    }
  }
  const face = on[0] as number;
  return inFace(poly, face, p) ? { kind: 'face', face } : null;
}

export type ThreePointsCode =
  | 'same-point'
  | 'collinear'
  | 'off-surface'
  | 'touch-vertex'
  | 'touch-edge'
  | 'touch-segment'
  | 'none';

export interface ThreePointsRefusal {
  ok: false;
  code: ThreePointsCode;
  /** Текст для ученика, формулы в $…$. */
  message: string;
  /** Номер точки (0…2), с которой проблема, если она одна. */
  point?: number;
}

export interface ThreePointsSection {
  ok: true;
  plane: Plane;
  section: Section;
  /** 'face' — плоскость совпала с гранью: сечение — сама грань. */
  kind: 'polygon' | 'face';
  /** Пояснение для ученика (у 'face'), формулы в $…$. */
  note?: string;
}

const fmt = (names: readonly (string | undefined)[], i: number) => {
  const n = names[i];
  return n === undefined ? `${i + 1}-я точка` : `точка $${n}$`;
};

/**
 * Проверки трёх точек и сечение плоскостью через них.
 * names — имена точек (для текста), необязательно.
 */
export function sectionByThreePoints(
  poly: Polyhedron,
  pts: readonly [V3, V3, V3],
  names: readonly (string | undefined)[] = [],
): ThreePointsSection | ThreePointsRefusal {
  for (let i = 0; i < 3; i++) {
    if (placeOnSurface(poly, pts[i] as V3) === null) {
      const who = fmt(names, i);
      return {
        ok: false,
        code: 'off-surface',
        point: i,
        message: `${who[0]?.toUpperCase()}${who.slice(1)} не лежит на поверхности фигуры — выберите точку на ребре или грани.`,
      };
    }
  }
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      if (veq(pts[i] as V3, pts[j] as V3)) {
        return {
          ok: false,
          code: 'same-point',
          point: j,
          message: 'Точки совпадают — нужны три разные точки.',
        };
      }
    }
  }
  const plane = planeThrough(pts[0], pts[1], pts[2]);
  if (plane === null) {
    return {
      ok: false,
      code: 'collinear',
      point: 2,
      message:
        'Три точки лежат на одной прямой — через них проходит бесконечно много плоскостей. Выберите другую точку.',
    };
  }
  return sectionByPlane(poly, plane);
}

/** Сечение плоскостью с разбором вырожденных случаев (для проверок и тестов). */
export function sectionByPlane(
  poly: Polyhedron,
  plane: Plane,
): ThreePointsSection | ThreePointsRefusal {
  const s = section(poly, plane);
  if (s.kind === 'polygon') return { ok: true, plane, section: s, kind: 'polygon' };
  if (s.kind === 'face') {
    const f = at(poly.faces, s.face as number);
    return {
      ok: true,
      plane,
      section: s,
      kind: 'face',
      note: `Плоскость совпадает с гранью $${f.name}$ — сечение и есть эта грань.`,
    };
  }
  if (s.kind === 'none') {
    return { ok: false, code: 'none', message: 'Плоскость не пересекает фигуру — сечения нет.' };
  }
  // Касание: одна вершина или отрезок (ребро целиком).
  const vs = s.vertices;
  if (vs.length === 1) {
    const v = vs[0] as SectionVertex;
    const name = v.vertex === undefined ? '' : ` $${at(poly.vertices, v.vertex).name}$`;
    return {
      ok: false,
      code: 'touch-vertex',
      message: `Плоскость касается фигуры только в вершине${name} — сечения-многоугольника нет.`,
    };
  }
  const [a, b] = vs as [SectionVertex, SectionVertex];
  const ei =
    a.vertex !== undefined && b.vertex !== undefined
      ? poly.edges.findIndex(
          (e) => (e.a === a.vertex && e.b === b.vertex) || (e.a === b.vertex && e.b === a.vertex),
        )
      : -1;
  if (ei >= 0) {
    return {
      ok: false,
      code: 'touch-edge',
      message: `Плоскость касается фигуры только по ребру $${edgeName(poly, at(poly.edges, ei))}$ — сечения-многоугольника нет.`,
    };
  }
  return {
    ok: false,
    code: 'touch-segment',
    message: 'Плоскость касается фигуры только по отрезку — сечения-многоугольника нет.',
  };
}

/* ── Внутри построения ────────────────────────────────────── */

export interface BuiltThreePointSection {
  /** Плоскость plane3 в построении. */
  plane: ObjId;
  section: Section;
  kind: 'polygon' | 'face';
  note?: string;
  /** Точка построения для каждой вершины сечения (по порядку обхода). */
  vertexIds: ObjId[];
  /** Созданные здесь объекты (плоскость и новые вершины) — для отмены. */
  created: ObjId[];
}

/**
 * Сечение плоскостью через три точки построения. Вершины сечения,
 * совпавшие с имеющимися точками (вершины тела, выбранные точки),
 * берут их имена; остальные — новые точки на рёбрах со следующими
 * свободными буквами.
 */
export function buildThreePointSection(
  c: Construction,
  ids: readonly [ObjId, ObjId, ObjId],
): Result<BuiltThreePointSection> | ThreePointsRefusal {
  const [a, b, d] = ids.map((id) => c.point(id)) as [PointObj, PointObj, PointObj];
  const r = sectionByThreePoints(c.poly, [a.p, b.p, d.p], [a.name, b.name, d.name]);
  if (!r.ok) return r;
  const pl = c.plane3(ids[0], ids[1], ids[2]);
  if (!pl.ok) return pl;
  const created: ObjId[] = [pl.value];
  const existing = c.all().filter((o) => o.kind === 'point');
  const vertexIds = r.section.vertices.map((v) => {
    const same = existing.find((o) => o.kind === 'point' && veq(o.p, v.p));
    if (same !== undefined) return same.id;
    const e = at(c.poly.edges, v.edge as number);
    const res = c.pointOnEdge(
      at(c.poly.vertices, e.a).name,
      at(c.poly.vertices, e.b).name,
      v.t as Rat,
    );
    if (!res.ok) throw new Error(res.message);
    created.push(res.value);
    return res.value;
  });
  return {
    ok: true,
    value: {
      plane: pl.value,
      section: r.section,
      kind: r.kind,
      ...(r.note === undefined ? {} : { note: r.note }),
      vertexIds,
      created,
    },
  };
}

/**
 * Точная точка на ребре по приближённому параметру: шаг 1/step
 * (по умолчанию 1/12 — половины, трети, четверти, шестые). Концы
 * ребра возвращаются как вершины.
 */
export function snapOnEdge(
  poly: Polyhedron,
  edge: number,
  t: number,
  step = 12,
): { kind: 'vertex'; vertex: number } | { kind: 'edge'; edge: number; t: Rat; p: V3 } {
  const e = at(poly.edges, edge);
  const k = Math.min(step, Math.max(0, Math.round(t * step)));
  if (k === 0) return { kind: 'vertex', vertex: e.a };
  if (k === step) return { kind: 'vertex', vertex: e.b };
  const tt = rat(k, step);
  return {
    kind: 'edge',
    edge,
    t: tt,
    p: lerp(at(poly.vertices, e.a).p, at(poly.vertices, e.b).p, tt),
  };
}

/**
 * Точная точка в грани-параллелограмме по приближённым координатам
 * (α вдоль первой стороны, β вдоль последней), шаг 1/step. Если точка
 * легла на сторону — это ребро, в угол — вершина.
 */
export function snapOnFace(
  poly: Polyhedron,
  face: number,
  alpha: number,
  beta: number,
  step = 12,
): SurfacePlace & { p: V3 } {
  const f = at(poly.faces, face);
  const V0 = at(poly.vertices, at(f.idx, 0)).p;
  const V1 = at(poly.vertices, at(f.idx, 1)).p;
  const Vn = at(poly.vertices, at(f.idx, f.idx.length - 1)).p;
  const q = (x: number) => rat(Math.min(step, Math.max(0, Math.round(x * step))), step);
  const a = q(alpha);
  const b = q(beta);
  const p = add(V0, add(scale(sub(V1, V0), a), scale(sub(Vn, V0), b)));
  const place = placeOnSurface(poly, p);
  if (place === null) throw new Error('snapOnFace: точка вне грани');
  return { ...place, p };
}
