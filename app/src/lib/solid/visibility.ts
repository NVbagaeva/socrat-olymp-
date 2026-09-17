/**
 * Видимость линий чертежа.
 *
 * Ничего не проставляется руками: каждая линия делится на видимые
 * и скрытые куски по модели. Линия скрыта там, где между ней
 * и зрителем лежит грань непрозрачного тела или поверхность шара.
 *
 * Как считается: отрезок опрашивается в десятках точек, каждая
 * проверяется на попадание в проекцию грани и на глубину, границы
 * между соседними точками с разным ответом уточняются делением
 * пополам. Тела вращения для этого разбиты на грани; их собственные
 * контуры при этом считаются точно, а не по граням.
 */

import type { Body, Cone, Cylinder, Polyhedron, Sphere } from './model';
import { faceIsFlat } from './model';
import { TOWARD, circlePoint, depth, project, rayPoint } from './project';
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

function faceOccluder(owner: Body, points: Vec3[], verts: number[]): FaceOccluder | null {
  if (
    !faceIsFlat(
      points,
      points.map((_, i) => i),
    )
  ) {
    return null;
  }
  const poly = points.map(project);
  const depths = points.map(depth);

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

function polyhedronOccluders(body: Polyhedron): Occluder[] {
  const out: Occluder[] = [];
  body.faces.forEach((face) => {
    const occ = faceOccluder(
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
function cylinderOccluders(body: Cylinder): Occluder[] {
  const out: Occluder[] = [];
  const top: Vec3 = add(body.base, [0, 0, body.h]);
  const ring = (c: Vec3) =>
    Array.from({ length: FACETS }, (_, k) => circlePoint(c, body.r, (2 * Math.PI * k) / FACETS));
  const bottom = ring(body.base);
  const upper = ring(top);
  const cap = (pts: Vec3[]) => {
    const occ = faceOccluder(body, pts, []);
    if (occ) {
      out.push(occ);
    }
  };
  cap(bottom);
  cap(upper);
  for (let k = 0; k < FACETS; k += 1) {
    const n = (k + 1) % FACETS;
    const occ = faceOccluder(body, [at(bottom, k), at(bottom, n), at(upper, n), at(upper, k)], []);
    if (occ) {
      out.push(occ);
    }
  }
  return out;
}

function coneOccluders(body: Cone): Occluder[] {
  const out: Occluder[] = [];
  const sign = body.inverted ? -1 : 1;
  const apexZ = body.base[2] + sign * body.h;
  const ring = (c: Vec3, r: number) =>
    Array.from({ length: FACETS }, (_, k) => circlePoint(c, r, (2 * Math.PI * k) / FACETS));
  const bottom = ring(body.base, body.r);
  const cap = (pts: Vec3[]) => {
    const occ = faceOccluder(body, pts, []);
    if (occ) {
      out.push(occ);
    }
  };
  cap(bottom);
  if (body.top === undefined) {
    const apex: Vec3 = [body.base[0], body.base[1], apexZ];
    for (let k = 0; k < FACETS; k += 1) {
      const occ = faceOccluder(body, [at(bottom, k), at(bottom, (k + 1) % FACETS), apex], []);
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

function sphereOccluder(body: Sphere): Occluder {
  return {
    kind: 'sphere',
    owner: body,
    center: body.center,
    centerDepth: depth(body.center),
    r: body.r,
  };
}

/** Заслонки всех непрозрачных тел модели. */
export function occludersOf(bodies: readonly Body[]): Occluder[] {
  return bodies.flatMap((body) => {
    if (body.glass) {
      return [];
    }
    switch (body.kind) {
      case 'polyhedron':
        return polyhedronOccluders(body);
      case 'cylinder':
        return cylinderOccluders(body);
      case 'cone':
        return coneOccluders(body);
      case 'sphere':
        return [sphereOccluder(body)];
    }
  });
}

/** Заслонки только этого тела: прозрачное тело прячет свои рёбра само. */
export function selfOccluders(body: Body): Occluder[] {
  if (body.kind === 'polyhedron') {
    return polyhedronOccluders(body);
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
export function hidden(p: Vec3, occluders: readonly Occluder[], eps: number): boolean {
  const q = project(p);
  const d = depth(p);
  for (const occ of occluders) {
    if (occ.kind === 'sphere') {
      /* Луч через ту же точку чертежа: насколько он проходит мимо
         центра, настолько ближняя поверхность ближе центра. */
      const w = sub(occ.center, rayPoint(q));
      const along = dot(w, TOWARD);
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

const SAMPLES = 40;
const REFINE = 10;

/**
 * Разбить отрезок на видимые и скрытые куски.
 * skip — заслонки, которые для этого отрезка не считаются
 * (грани, которым ребро принадлежит).
 */
export function segmentRuns(
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
  const test = (t: number) => !hidden(lerp(a, b, t), list, eps);
  const ts = Array.from({ length: SAMPLES }, (_, k) => (k + 0.5) / SAMPLES);
  const states = ts.map(test);

  const runs: Run[] = [];
  let start = 0;
  let state = at(states, 0);
  for (let k = 1; k < SAMPLES; k += 1) {
    if (at(states, k) === state) {
      continue;
    }
    /* Граница между соседними точками: уточняем делением пополам. */
    let lo = at(ts, k - 1);
    let hi = at(ts, k);
    for (let r = 0; r < REFINE; r += 1) {
      const m = (lo + hi) / 2;
      if (test(m) === state) {
        lo = m;
      } else {
        hi = m;
      }
    }
    const cut = (lo + hi) / 2;
    runs.push({ t0: start, t1: cut, visible: state });
    start = cut;
    state = at(states, k);
  }
  runs.push({ t0: start, t1: 1, visible: state });
  return runs;
}

/**
 * Видимость ломаной по точкам: у каждой точки уже есть своя
 * видимость по самому телу (контуры тел вращения считаются точно),
 * сюда добавляется заслонение чужими телами.
 */
export function polylineVisibility(
  points: readonly Vec3[],
  selfVisible: readonly boolean[],
  occluders: readonly Occluder[],
  eps: number,
): boolean[] {
  return points.map((p, i) => at(selfVisible, i) && !hidden(p, occluders, eps));
}
