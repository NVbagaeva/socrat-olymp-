/**
 * Видимость линий чертежа.
 *
 * Ничего не проставляется руками: каждая линия делится на видимые
 * и скрытые куски по модели. Линия скрыта там, где между ней
 * и зрителем лежит грань непрозрачного тела или поверхность шара.
 *
 * Как считается: видимость отрезка может смениться только там, где
 * его проекция пересекает контур заслонки (сторону грани, контур
 * шара) или где отрезок протыкает её (плоскость грани, поверхность
 * шара). Эти точки находятся аналитически, отрезок режется по ним, и
 * каждый кусок проверяется одной точкой — серединой: закрыта ли она
 * лучом к зрителю. Тела вращения для этого разбиты на грани; их
 * собственные контуры при этом считаются точно, а не по граням.
 * Кривая (эллипс основания, контур шара) — ломаная: так же режется
 * каждая её хорда.
 */

import type { Body, Cone, Cylinder, Polyhedron, Sphere } from './model';
import { faceIsFlat } from './model';
import type { View } from './project';
import { type Vec2, type Vec3, add, at, dot, lerp, sub } from './vec';

/** Грань-заслонка: проекция и глубина как линейная функция точки. */
interface FaceOccluder {
  kind: 'face';
  owner: Body;
  /** Индексы вершин грани многогранника: чтобы своё ребро не прятала своя же грань. */
  verts: Set<number>;
  poly: Vec2[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** depth = a·X + b·Y + c */
  a: number;
  b: number;
  c: number;
}

interface SphereOccluder {
  kind: 'sphere';
  owner: Body;
  /** Центр и радиус: глубина передней поверхности считается по лучу. */
  center: Vec3;
  centerDepth: number;
  r: number;
}

export type Occluder = FaceOccluder | SphereOccluder;

/** Сколько граней у боковой поверхности тела вращения в заслонках. */
const FACETS = 48;

function faceOccluder(
  view: View,
  owner: Body,
  points: Vec3[],
  verts: number[],
): FaceOccluder | null {
  if (
    !faceIsFlat(
      points,
      points.map((_, i) => i),
    )
  ) {
    return null;
  }
  const poly = points.map(view.project);
  const depths = points.map(view.depth);

  /* Плоскость глубины по паре самых «раскрытых» рёбер: точность
     выше, чем по трём первым вершинам подряд. */
  let best = 0;
  let bi = 0;
  let bj = 0;
  const p0 = at(poly, 0);
  for (let i = 1; i < poly.length; i += 1) {
    for (let j = i + 1; j < poly.length; j += 1) {
      const pi = at(poly, i);
      const pj = at(poly, j);
      const area = Math.abs((pi[0] - p0[0]) * (pj[1] - p0[1]) - (pj[0] - p0[0]) * (pi[1] - p0[1]));
      if (area > best) {
        best = area;
        bi = i;
        bj = j;
      }
    }
  }
  if (best < 1e-9) {
    /* Грань видна с ребра: ничего не заслоняет. */
    return null;
  }
  const pi = at(poly, bi);
  const pj = at(poly, bj);
  const d0 = at(depths, 0);
  const ux = pi[0] - p0[0];
  const uy = pi[1] - p0[1];
  const vx = pj[0] - p0[0];
  const vy = pj[1] - p0[1];
  const du = at(depths, bi) - d0;
  const dv = at(depths, bj) - d0;
  const det = ux * vy - uy * vx;
  const a = (du * vy - dv * uy) / det;
  const b = (ux * dv - vx * du) / det;
  const c = d0 - a * p0[0] - b * p0[1];

  return {
    kind: 'face',
    owner,
    verts: new Set(verts),
    poly,
    minX: Math.min(...poly.map((p) => p[0])),
    maxX: Math.max(...poly.map((p) => p[0])),
    minY: Math.min(...poly.map((p) => p[1])),
    maxY: Math.max(...poly.map((p) => p[1])),
    a,
    b,
    c,
  };
}

function polyhedronOccluders(view: View, body: Polyhedron): Occluder[] {
  const out: Occluder[] = [];
  body.faces.forEach((face) => {
    const occ = faceOccluder(
      view,
      body,
      face.map((i) => at(body.vertices, i)),
      face,
    );
    if (occ) {
      out.push(occ);
    }
  });
  return out;
}

/** Основания и боковая поверхность цилиндра гранями. */
function cylinderOccluders(view: View, body: Cylinder): Occluder[] {
  const out: Occluder[] = [];
  const top: Vec3 = add(body.base, [0, 0, body.h]);
  const ring = (c: Vec3) =>
    Array.from({ length: FACETS }, (_, k) =>
      view.circlePoint(c, body.r, (2 * Math.PI * k) / FACETS),
    );
  const bottom = ring(body.base);
  const upper = ring(top);
  const cap = (pts: Vec3[]) => {
    const occ = faceOccluder(view, body, pts, []);
    if (occ) {
      out.push(occ);
    }
  };
  cap(bottom);
  cap(upper);
  for (let k = 0; k < FACETS; k += 1) {
    const n = (k + 1) % FACETS;
    const occ = faceOccluder(
      view,
      body,
      [at(bottom, k), at(bottom, n), at(upper, n), at(upper, k)],
      [],
    );
    if (occ) {
      out.push(occ);
    }
  }
  return out;
}

function coneOccluders(view: View, body: Cone): Occluder[] {
  const out: Occluder[] = [];
  const sign = body.inverted ? -1 : 1;
  const apexZ = body.base[2] + sign * body.h;
  const ring = (c: Vec3, r: number) =>
    Array.from({ length: FACETS }, (_, k) => view.circlePoint(c, r, (2 * Math.PI * k) / FACETS));
  const bottom = ring(body.base, body.r);
  const cap = (pts: Vec3[]) => {
    const occ = faceOccluder(view, body, pts, []);
    if (occ) {
      out.push(occ);
    }
  };
  cap(bottom);
  if (body.top === undefined) {
    const apex: Vec3 = [body.base[0], body.base[1], apexZ];
    for (let k = 0; k < FACETS; k += 1) {
      const occ = faceOccluder(view, body, [at(bottom, k), at(bottom, (k + 1) % FACETS), apex], []);
      if (occ) {
        out.push(occ);
      }
    }
  } else {
    const upper = ring([body.base[0], body.base[1], apexZ], body.top);
    cap(upper);
    for (let k = 0; k < FACETS; k += 1) {
      const n = (k + 1) % FACETS;
      const occ = faceOccluder(
        view,
        body,
        [at(bottom, k), at(bottom, n), at(upper, n), at(upper, k)],
        [],
      );
      if (occ) {
        out.push(occ);
      }
    }
  }
  return out;
}

function sphereOccluder(view: View, body: Sphere): Occluder {
  return {
    kind: 'sphere',
    owner: body,
    center: body.center,
    centerDepth: view.depth(body.center),
    r: body.r,
  };
}

/** Заслонки всех непрозрачных тел модели. */
export function occludersOf(view: View, bodies: readonly Body[]): Occluder[] {
  return bodies.flatMap((body) => {
    if (body.glass) {
      return [];
    }
    switch (body.kind) {
      case 'polyhedron':
        return polyhedronOccluders(view, body);
      case 'cylinder':
        return cylinderOccluders(view, body);
      case 'cone':
        return coneOccluders(view, body);
      case 'sphere':
        return [sphereOccluder(view, body)];
    }
  });
}

/** Заслонки только этого тела: прозрачное тело прячет свои рёбра само. */
export function selfOccluders(view: View, body: Body): Occluder[] {
  if (body.kind === 'polyhedron') {
    return polyhedronOccluders(view, body);
  }
  return [];
}

function inside(poly: readonly Vec2[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const pi = at(poly, i);
    const pj = at(poly, j);
    if (pi[1] > y !== pj[1] > y) {
      const cross = ((pj[0] - pi[0]) * (y - pi[1])) / (pj[1] - pi[1]) + pi[0];
      if (x < cross) {
        hit = !hit;
      }
    }
  }
  return hit;
}

/** Точка пространства скрыта хотя бы одной заслонкой из списка. */
export function hidden(view: View, p: Vec3, occluders: readonly Occluder[], eps: number): boolean {
  const q = view.project(p);
  const d = view.depth(p);
  for (const occ of occluders) {
    if (occ.kind === 'sphere') {
      /* Луч через ту же точку чертежа: насколько он проходит мимо
         центра, настолько ближняя поверхность ближе центра. */
      const w = sub(occ.center, view.rayPoint(q));
      const along = dot(w, view.toward);
      const rr = occ.r * occ.r - (dot(w, w) - along * along);
      if (rr > 0 && occ.centerDepth + Math.sqrt(rr) > d + eps) {
        return true;
      }
      continue;
    }
    if (q[0] < occ.minX || q[0] > occ.maxX || q[1] < occ.minY || q[1] > occ.maxY) {
      continue;
    }
    if (occ.a * q[0] + occ.b * q[1] + occ.c > d + eps && inside(occ.poly, q[0], q[1])) {
      return true;
    }
  }
  return false;
}

/** Кусок линии: доля от начала до конца и видимость. */
export interface Run {
  t0: number;
  t1: number;
  visible: boolean;
}

/** Параметр t ∈ (0, 1) пересечения отрезков ab и cd на чертеже. */
function crossT(a: Vec2, b: Vec2, c: Vec2, d: Vec2): number | null {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const qx = c[0] - a[0];
  const qy = c[1] - a[1];
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  return t > 0 && t < 1 && u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
}

/** Корни квадратного уравнения A t² + B t + C = 0 внутри (0, 1). */
function rootsIn01(A: number, B: number, C: number): number[] {
  if (Math.abs(A) < 1e-14) {
    if (Math.abs(B) < 1e-14) return [];
    const t = -C / B;
    return t > 0 && t < 1 ? [t] : [];
  }
  const D = B * B - 4 * A * C;
  if (D < 0) return [];
  const q = Math.sqrt(D);
  return [(-B - q) / (2 * A), (-B + q) / (2 * A)].filter((t) => t > 0 && t < 1);
}

/**
 * Точки отрезка, где может смениться видимость: пересечения проекции
 * с контурами заслонок и проколы заслонок.
 */
function cutPoints(view: View, a: Vec3, b: Vec3, list: readonly Occluder[]): number[] {
  const pa = view.project(a);
  const pb = view.project(b);
  const da = view.depth(a);
  const db = view.depth(b);
  const ts: number[] = [];
  const minX = Math.min(pa[0], pb[0]);
  const maxX = Math.max(pa[0], pb[0]);
  const minY = Math.min(pa[1], pb[1]);
  const maxY = Math.max(pa[1], pb[1]);
  for (const occ of list) {
    if (occ.kind === 'sphere') {
      /* Контур шара на чертеже — круг радиуса r вокруг проекции центра. */
      const c = view.project(occ.center);
      const dx = pb[0] - pa[0];
      const dy = pb[1] - pa[1];
      const fx = pa[0] - c[0];
      const fy = pa[1] - c[1];
      ts.push(
        ...rootsIn01(dx * dx + dy * dy, 2 * (fx * dx + fy * dy), fx * fx + fy * fy - occ.r * occ.r),
      );
      /* Прокол поверхности шара. */
      const ab = sub(b, a);
      const ac = sub(a, occ.center);
      ts.push(...rootsIn01(dot(ab, ab), 2 * dot(ac, ab), dot(ac, ac) - occ.r * occ.r));
      continue;
    }
    if (maxX < occ.minX || minX > occ.maxX || maxY < occ.minY || minY > occ.maxY) continue;
    const n = occ.poly.length;
    for (let i = 0; i < n; i += 1) {
      const t = crossT(pa, pb, at(occ.poly, i), at(occ.poly, (i + 1) % n));
      if (t !== null) ts.push(t);
    }
    /* Прокол плоскости грани: глубина отрезка и глубина грани под ним —
       линейные функции t. */
    const fa = occ.a * pa[0] + occ.b * pa[1] + occ.c - da;
    const fb = occ.a * pb[0] + occ.b * pb[1] + occ.c - db;
    if (fa !== fb && fa * fb < 0) ts.push(fa / (fa - fb));
  }
  return ts;
}

/**
 * Разбить отрезок на видимые и скрытые куски.
 * skip — заслонки, которые для этого отрезка не считаются
 * (грани, которым ребро принадлежит).
 */
export function segmentRuns(
  view: View,
  a: Vec3,
  b: Vec3,
  occluders: readonly Occluder[],
  eps: number,
  skip?: (occ: Occluder) => boolean,
): Run[] {
  const list = skip ? occluders.filter((occ) => !skip(occ)) : occluders;
  if (list.length === 0) {
    return [{ t0: 0, t1: 1, visible: true }];
  }
  const ts = [0, 1, ...cutPoints(view, a, b, list)].sort((x, y) => x - y);
  const runs: Run[] = [];
  for (let i = 0; i + 1 < ts.length; i += 1) {
    const t0 = at(ts, i);
    const t1 = at(ts, i + 1);
    if (t1 - t0 < 1e-9) continue;
    const visible = !hidden(view, lerp(a, b, (t0 + t1) / 2), list, eps);
    const last = runs.at(-1);
    if (last && last.visible === visible) last.t1 = t1;
    else runs.push({ t0: last ? last.t1 : 0, t1, visible });
  }
  return mergeTiny(runs);
}

/* Крошечный кусок (касание, вершина на контуре) — не рисуется отдельно:
   доля отрезка меньше 1/1000 сливается с соседом. */
function mergeTiny(runs: Run[]): Run[] {
  const MIN = 1e-3;
  const out: Run[] = [];
  for (const r of runs) {
    const last = out.at(-1);
    if (last && (r.t1 - r.t0 < MIN || last.visible === r.visible)) {
      last.t1 = r.t1;
      continue;
    }
    if (!last && r.t1 - r.t0 < MIN && runs.length > 1) continue;
    out.push({ ...r, t0: last ? last.t1 : 0 });
  }
  return out;
}

/**
 * Видимость ломаной (кривой тела вращения): своя видимость точек уже
 * посчитана по самому телу — контуры тел вращения точные; чужие тела
 * режут каждую хорду, как отрезок (segmentRuns). Хорда, на концах
 * которой своя видимость разная, делится пополам: там контур.
 * Возвращаются куски по порядку: точки и видимость.
 */
export function polylineRuns(
  view: View,
  points: readonly Vec3[],
  selfVisible: readonly boolean[],
  occluders: readonly Occluder[],
  eps: number,
): { points: Vec3[]; visible: boolean }[] {
  const out: { points: Vec3[]; visible: boolean }[] = [];
  const push = (p: Vec3, q: Vec3, visible: boolean) => {
    const last = out.at(-1);
    if (last && last.visible === visible) {
      last.points.push(q);
    } else {
      out.push({ points: [p, q], visible });
    }
  };
  for (let i = 0; i + 1 < points.length; i += 1) {
    const a = at(points, i);
    const b = at(points, i + 1);
    const sa = at(selfVisible, i);
    const sb = at(selfVisible, i + 1);
    const cuts = sa === sb ? [] : [0.5];
    const runs = segmentRuns(view, a, b, occluders, eps);
    const ts = [...new Set([0, 1, ...cuts, ...runs.flatMap((r) => [r.t0, r.t1])])].sort(
      (x, y) => x - y,
    );
    for (let k = 0; k + 1 < ts.length; k += 1) {
      const t0 = at(ts, k);
      const t1 = at(ts, k + 1);
      const m = (t0 + t1) / 2;
      const self = sa === sb ? sa : m < 0.5 ? sa : sb;
      const run = runs.find((r) => r.t0 <= m && m <= r.t1);
      push(lerp(a, b, t0), lerp(a, b, t1), self && (run?.visible ?? true));
    }
  }
  return out;
}
