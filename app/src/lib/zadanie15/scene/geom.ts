/**
 * Геометрия сцены в числах с плавающей точкой: обрезка плоскости
 * рамкой, обрезка многоугольников, видимость линий.
 *
 * Здесь считается только то, что нужно для рисования. Все решения
 * (лежит ли точка в плоскости, пересекаются ли прямые) принимает ядро
 * core/ точно; сюда приходят уже готовые объекты.
 */

import {
  type Basis,
  type P2,
  type Vec,
  depthOf,
  project,
  vadd,
  vcross,
  vdot,
  vlen,
  vlerp,
  vnorm,
  vscale,
  vsub,
} from './camera';

export interface Box3 {
  min: Vec;
  max: Vec;
}

export function boxOf(points: readonly Vec[]): Box3 {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i] as number, p[i] as number);
      max[i] = Math.max(max[i] as number, p[i] as number);
    }
  }
  return { min, max };
}

/** Рамка вокруг тела: тот же центр, стороны в k раз больше. */
export function frameOf(box: Box3, k: number): Box3 {
  const c = vscale(vadd(box.min, box.max), 0.5);
  const h = vscale(vsub(box.max, box.min), 0.5 * k);
  return { min: vsub(c, h), max: vadd(c, h) };
}

/** Рамка, расширенная так, чтобы вместить точки (с запасом margin). */
export function expandBox(box: Box3, points: readonly Vec[], margin: number): Box3 {
  if (points.length === 0) return box;
  const b = boxOf(points);
  return {
    min: [
      Math.min(box.min[0], b.min[0] - margin),
      Math.min(box.min[1], b.min[1] - margin),
      Math.min(box.min[2], b.min[2] - margin),
    ],
    max: [
      Math.max(box.max[0], b.max[0] + margin),
      Math.max(box.max[1], b.max[1] + margin),
      Math.max(box.max[2], b.max[2] + margin),
    ],
  };
}

export function boxCorners(box: Box3): Vec[] {
  const out: Vec[] = [];
  for (const x of [box.min[0], box.max[0]])
    for (const y of [box.min[1], box.max[1]])
      for (const z of [box.min[2], box.max[2]]) out.push([x, y, z]);
  return out;
}

const BOX_EDGES: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

/** Два единичных вектора в плоскости с нормалью n. */
export function planeBasis(n: Vec): [Vec, Vec] {
  const u = vnorm(n);
  const seed: Vec = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = vnorm(vcross(u, seed));
  const e2 = vcross(u, e1);
  return [e1, e2];
}

/** Обход выпуклого набора точек одной плоскости против часовой стрелки. */
export function orderInPlane(points: readonly Vec[], n: Vec): Vec[] {
  if (points.length < 3) return [...points];
  const c = vscale(
    points.reduce((s, p) => vadd(s, p), [0, 0, 0] as Vec),
    1 / points.length,
  );
  const [e1, e2] = planeBasis(n);
  return [...points].sort((a, b) => {
    const da = vsub(a, c);
    const db = vsub(b, c);
    return Math.atan2(vdot(da, e2), vdot(da, e1)) - Math.atan2(vdot(db, e2), vdot(db, e1));
  });
}

/**
 * Лист плоскости n·X = c, обрезанный рамкой: выпуклый многоугольник
 * из точек пересечения плоскости с рёбрами рамки.
 */
export function planeBoxPolygon(n: Vec, c: number, box: Box3): Vec[] {
  const corners = boxCorners(box);
  const d = corners.map((p) => vdot(n, p) - c);
  const pts: Vec[] = [];
  const push = (p: Vec) => {
    if (!pts.some((q) => vlen(vsub(q, p)) < 1e-9)) pts.push(p);
  };
  const eps = 1e-9 * (1 + vlen(n));
  corners.forEach((p, i) => {
    if (Math.abs(d[i] as number) <= eps) push(p);
  });
  for (const [i, j] of BOX_EDGES) {
    const di = d[i] as number;
    const dj = d[j] as number;
    if ((di > eps && dj < -eps) || (di < -eps && dj > eps)) {
      push(vlerp(corners[i] as Vec, corners[j] as Vec, di / (di - dj)));
    }
  }
  return orderInPlane(pts, n);
}

/** Отрезок прямой p + t·d внутри рамки; null — не задевает. */
export function clipLineBox(p: Vec, d: Vec, box: Box3): [Vec, Vec] | null {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (let i = 0; i < 3; i++) {
    const di = d[i] as number;
    const pi = p[i] as number;
    const lo = box.min[i] as number;
    const hi = box.max[i] as number;
    if (Math.abs(di) < 1e-12) {
      if (pi < lo || pi > hi) return null;
      continue;
    }
    let a = (lo - pi) / di;
    let b = (hi - pi) / di;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
  }
  if (t0 > t1) return null;
  return [vadd(p, vscale(d, t0)), vadd(p, vscale(d, t1))];
}

/** Часть выпуклого многоугольника по одну сторону плоскости (n·X − c ≥ 0 при keepPositive). */
export function clipPolygonHalfspace(
  poly: readonly Vec[],
  n: Vec,
  c: number,
  keepPositive: boolean,
): Vec[] {
  const out: Vec[] = [];
  const n0 = poly.length;
  for (let i = 0; i < n0; i++) {
    const a = poly[i] as Vec;
    const b = poly[(i + 1) % n0] as Vec;
    const da = (vdot(n, a) - c) * (keepPositive ? 1 : -1);
    const db = (vdot(n, b) - c) * (keepPositive ? 1 : -1);
    if (da >= 0) out.push(a);
    if ((da >= 0 && db < 0) || (da < 0 && db >= 0)) {
      out.push(vlerp(a, b, da / (da - db)));
    }
  }
  return out;
}

const cross2 = (o: P2, a: P2, b: P2): number =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Площадь со знаком: > 0 — обход против часовой (в системе Y вниз — наоборот, но знак нужен лишь для согласования). */
export function signedArea(poly: readonly P2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as P2;
    const b = poly[(i + 1) % poly.length] as P2;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

/** Внутри ли точка выпуклого многоугольника (любая ориентация). */
export function pointInConvex(poly: readonly P2[], q: P2): boolean {
  if (poly.length < 3) return false;
  const sign = Math.sign(signedArea(poly)) || 1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as P2;
    const b = poly[(i + 1) % poly.length] as P2;
    if (cross2(a, b, q) * sign < -1e-9) return false;
  }
  return true;
}

/** Пересечение многоугольника с выпуклым окном (Сазерленд — Ходжман). */
export function clipPolygon2(subject: readonly P2[], clip: readonly P2[]): P2[] {
  if (clip.length < 3) return [];
  const sign = Math.sign(signedArea(clip)) || 1;
  let out: P2[] = [...subject];
  for (let i = 0; i < clip.length && out.length > 0; i++) {
    const a = clip[i] as P2;
    const b = clip[(i + 1) % clip.length] as P2;
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j] as P2;
      const q = input[(j + 1) % input.length] as P2;
      const dp = cross2(a, b, p) * sign;
      const dq = cross2(a, b, q) * sign;
      if (dp >= 0) out.push(p);
      if ((dp >= 0 && dq < 0) || (dp < 0 && dq >= 0)) {
        const t = dp / (dp - dq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out;
}

export const centroid2 = (poly: readonly P2[]): P2 =>
  poly.length === 0
    ? [0, 0]
    : [
        poly.reduce((s, p) => s + p[0], 0) / poly.length,
        poly.reduce((s, p) => s + p[1], 0) / poly.length,
      ];

/* ── Видимость ─────────────────────────────────────────────────── */

/** Грань-заслонка: проекция и глубина как линейная функция точки экрана. */
export interface Occluder {
  poly: P2[];
  /** depth = a·X + b·Y + k */
  a: number;
  b: number;
  k: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Заслонка из грани с нормалью n (n·X = c). Точка луча через (X, Y)
 * на глубине d — это X·right − Y·up + d·toward, и из уравнения
 * плоскости глубина выражается линейно.
 */
export function occluderOf(b: Basis, n: Vec, c: number, poly3: readonly Vec[]): Occluder | null {
  const nt = vdot(n, b.toward);
  if (Math.abs(nt) < 1e-12) return null;
  const poly = poly3.map((p) => project(b, p));
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return {
    poly,
    a: -vdot(n, b.right) / nt,
    b: vdot(n, b.up) / nt,
    k: c / nt,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Скрыта ли точка экрана на глубине d хотя бы одной заслонкой. */
export function hiddenAt(occs: readonly Occluder[], q: P2, d: number, eps: number): boolean {
  for (const o of occs) {
    if (q[0] < o.minX - eps || q[0] > o.maxX + eps || q[1] < o.minY - eps || q[1] > o.maxY + eps)
      continue;
    if (o.a * q[0] + o.b * q[1] + o.k > d + eps && pointInConvex(o.poly, q)) return true;
  }
  return false;
}

export interface Run {
  t0: number;
  t1: number;
  visible: boolean;
}

const SAMPLES = 48;
const REFINE = 9;

/**
 * Разбить отрезок на видимые и скрытые куски: отрезок опрашивается
 * в десятках точек, границы уточняются делением пополам — как
 * в solid/visibility.ts.
 */
export function segmentRuns(
  b: Basis,
  A: Vec,
  B: Vec,
  occs: readonly Occluder[],
  eps: number,
): Run[] {
  if (occs.length === 0) return [{ t0: 0, t1: 1, visible: true }];
  const test = (t: number) => {
    const p = vlerp(A, B, t);
    return !hiddenAt(occs, project(b, p), depthOf(b, p), eps);
  };
  const ts = Array.from({ length: SAMPLES }, (_, k) => (k + 0.5) / SAMPLES);
  const states = ts.map(test);
  const runs: Run[] = [];
  let start = 0;
  let state = states[0] as boolean;
  for (let k = 1; k < SAMPLES; k++) {
    if (states[k] === state) continue;
    let lo = ts[k - 1] as number;
    let hi = ts[k] as number;
    for (let r = 0; r < REFINE; r++) {
      const m = (lo + hi) / 2;
      if (test(m) === state) lo = m;
      else hi = m;
    }
    const cut = (lo + hi) / 2;
    runs.push({ t0: start, t1: cut, visible: state });
    start = cut;
    state = states[k] as boolean;
  }
  runs.push({ t0: start, t1: 1, visible: state });
  return runs;
}
