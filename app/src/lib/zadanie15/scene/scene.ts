/**
 * Сцена задания №15: построение из ядра → то, что рисуется.
 *
 * Вход — Construction (точная геометрия, происхождение объектов),
 * камера и режим. Выход — плоская картина в координатах viewBox:
 * грани, рёбра с видимостью, листы плоскостей, обрезанные рамкой,
 * линии пересечения с видимыми и скрытыми кусками, точки, подписи
 * (TeX) и кандидаты в вершины сечения. Ни React, ни SVG здесь нет:
 * ту же сцену можно собрать в Node и проверить числа.
 *
 * Режимы: в «изучении» линии пересечения и кандидаты показываются
 * сами, в «тренажёре» — только после reveal (сравнение после
 * проверки): их строит ученик.
 */

import {
  type Construction,
  type ObjId,
  type PlaneRef,
  at,
  section as coreSection,
  toArray,
  toNumber,
} from '../core';
import { parallelPlanes, samePlane } from '../core/vec';
import {
  type Basis,
  type Camera,
  type P2,
  type Vec,
  basisOf,
  depthOf,
  project,
  vadd,
  vlen,
  vlerp,
  vscale,
  vsub,
} from './camera';
import {
  type Box3,
  type Occluder,
  boxCorners,
  boxOf,
  centroid2,
  clipLineBox,
  clipPolygon2,
  clipPolygonHalfspace,
  expandBox,
  frameOf,
  occluderOf,
  planeBoxPolygon,
  segmentRuns,
} from './geom';

export type Mode = 'learn' | 'train';

export interface SceneOptions {
  camera: Camera;
  mode: Mode;
  /** В тренажёре после проверки: показать линии и кандидатов для сравнения. */
  reveal?: boolean;
  /** Грани, плоскости которых продлены листом. */
  facePlanes: readonly number[];
  /** Показывать шаги построения не дальше этого (индекс в steps()); null — все. */
  upTo?: number | null;
  /** Выбранная тапом прямая пересечения: подсвечиваются её плоскости и общие точки. */
  selected?: ObjId | null;
  /** Сторона viewBox. */
  size?: number;
  /** Во сколько раз рамка листов больше тела. */
  frame?: number;
}

export interface Seg2 {
  a: P2;
  b: P2;
  visible: boolean;
}

export interface SceneFace {
  index: number;
  name: string;
  points: P2[];
  front: boolean;
}

export interface SceneEdge {
  index: number;
  a: P2;
  b: P2;
  visible: boolean;
}

export interface SceneSheet {
  /** 'p7' у построенной плоскости, 'face:2' у грани. */
  id: string;
  ref: PlaneRef;
  color: string;
  points: P2[];
  /** Куски листа перед телом: рисуются поверх граней. */
  frontParts: P2[][];
  /** Откуда лист «вырастает» при появлении. */
  origin: P2;
  label: { tex: string; p: P2 };
  isFace: boolean;
  highlighted: boolean;
}

export interface SceneSection {
  planeId: ObjId;
  color: string;
  points: P2[];
  outline: Seg2[];
}

export interface SceneLine {
  id: ObjId;
  /** meet — пересечение плоскостей; aux — прямая построения; ext — продолжение ребра. */
  kind: 'meet' | 'aux' | 'ext';
  runs: Seg2[];
  color: string;
  label: { tex: string; p: P2 } | null;
  /** Общие точки двух плоскостей (у meet), через которые прямая обоснована. */
  through: ObjId[];
  origin: P2;
  /** Листы двух плоскостей (у meet). */
  sheets: [string, string] | null;
  selected: boolean;
}

export interface ScenePoint {
  id: ObjId;
  p: P2;
  tex: string;
  kind: 'vertex' | 'onEdge' | 'built' | 'free';
  draggable: boolean;
  /** Ребро, по которому точку можно тащить. */
  edge: number | null;
  label: P2;
  highlighted: boolean;
}

export interface SceneCandidate {
  lineId: ObjId;
  p: P2;
  onSegment: boolean;
  edge: number;
}

export interface Scene2D {
  size: number;
  faces: SceneFace[];
  edges: SceneEdge[];
  sheets: SceneSheet[];
  sections: SceneSection[];
  lines: SceneLine[];
  points: ScenePoint[];
  candidates: SceneCandidate[];
  /** Сообщение под чертежом: «Плоскости параллельны — общей линии нет». */
  notice: string | null;
  stepCount: number;
}

export const PLANE_COLORS = [
  'var(--color-plane-1)',
  'var(--color-plane-2)',
  'var(--color-plane-3)',
  'var(--color-plane-4)',
] as const;
export const FACE_PLANE_COLOR = 'var(--color-plane-face)';
export const PARALLEL_NOTICE = 'Плоскости параллельны — общей линии нет';

/** Экранная система: центр, масштаб, базис. */
interface Screen {
  b: Basis;
  center: Vec;
  scale: number;
  half: number;
  /** Точка пространства → viewBox. */
  to: (p: Vec) => P2;
  /** Проекция без масштаба — для заслонок. */
  raw: (p: Vec) => P2;
  depth: (p: Vec) => number;
}

const PAD = 0.04;

function screenOf(b: Basis, frame: Box3, size: number): Screen {
  const center = vscale(vadd(frame.min, frame.max), 0.5);
  const R = Math.max(...boxCorners(frame).map((p) => vlen(vsub(p, center)))) || 1;
  const half = size / 2;
  const scale = (half * (1 - PAD)) / R;
  const raw = (p: Vec) => project(b, vsub(p, center));
  return {
    b,
    center,
    scale,
    half,
    raw,
    to: (p) => {
      const q = raw(p);
      return [half + q[0] * scale, half + q[1] * scale];
    },
    depth: (p) => depthOf(b, vsub(p, center)),
  };
}

const mid2 = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Куски отрезка по видимости → экранные отрезки. */
function runsToSegs(scr: Screen, A: Vec, B: Vec, occs: readonly Occluder[], eps: number): Seg2[] {
  return segmentRuns(scr.b, vsub(A, scr.center), vsub(B, scr.center), occs, eps).map((r) => ({
    a: scr.to(vlerp(A, B, r.t0)),
    b: scr.to(vlerp(A, B, r.t1)),
    visible: r.visible,
  }));
}

/** Подпись сдвигается от центра фигуры наружу. */
function offsetAway(p: P2, from: P2, dist: number): P2 {
  const dx = p[0] - from[0];
  const dy = p[1] - from[1];
  const l = Math.hypot(dx, dy) || 1;
  return [p[0] + (dx / l) * dist, p[1] + (dy / l) * dist];
}

export function buildScene(c: Construction, opts: SceneOptions): Scene2D {
  const size = opts.size ?? 600;
  const b = basisOf(opts.camera);
  const poly = c.poly;
  const verts = poly.vertices.map((v) => toArray(v.p) as Vec);
  const showAll = opts.mode === 'learn' || opts.reveal === true;

  /* Какие шаги видны: до upTo включительно. Вершины — всегда. */
  const steps = c.steps();
  const limit = opts.upTo === undefined || opts.upTo === null ? steps.length - 1 : opts.upTo;
  const shown = new Set(steps.slice(0, Math.max(0, limit + 1)));
  const isShown = (id: ObjId) => c.get(id).origin.op === 'vertex' || shown.has(id);

  /* Рамка: в frame раз больше тела, плюс все построенные точки. */
  const builtPoints = c
    .all()
    .filter((o) => o.kind === 'point' && isShown(o.id))
    .map((o) => toArray((o as { p: (typeof poly.vertices)[number]['p'] }).p) as Vec);
  const body = boxOf(verts);
  const frame = expandBox(
    frameOf(body, opts.frame ?? 1.5),
    builtPoints,
    0.25 * (body.max[0] - body.min[0] || 1),
  );
  const scr = screenOf(b, frame, size);
  const figureCenter = scr.to(vscale(vadd(body.min, body.max), 0.5));
  const extent = Math.max(...vsub(body.max, body.min)) || 1;
  const eps = extent * 1e-7;

  /* Грани: нормаль наружу — обход вершин против часовой снаружи. */
  const faces: SceneFace[] = poly.faces.map((f, index) => {
    const n = toArray(f.plane.n) as Vec;
    const front = n[0] * b.toward[0] + n[1] * b.toward[1] + n[2] * b.toward[2] > 1e-12;
    return { index, name: f.name, points: f.idx.map((i) => scr.to(verts[i] as Vec)), front };
  });
  const occs: Occluder[] = [];
  poly.faces.forEach((f, i) => {
    if (!(faces[i] as SceneFace).front) return;
    const n = toArray(f.plane.n) as Vec;
    const occ = occluderOf(
      b,
      n,
      toNumber(f.plane.c) - (n[0] * scr.center[0] + n[1] * scr.center[1] + n[2] * scr.center[2]),
      f.idx.map((vi) => vsub(verts[vi] as Vec, scr.center)),
    );
    if (occ) occs.push(occ);
  });

  const edges: SceneEdge[] = poly.edges.map((e, index) => ({
    index,
    a: scr.to(verts[e.a] as Vec),
    b: scr.to(verts[e.b] as Vec),
    visible: e.faces.some((fi) => (faces[fi] as SceneFace).front),
  }));

  /* ── Плоскости ───────────────────────────────────────────── */

  const planeObjs = c.all().filter((o) => o.kind === 'plane' && isShown(o.id));
  const colorOf = new Map<ObjId, string>();
  c.all()
    .filter((o) => o.kind === 'plane')
    .forEach((o, i) => colorOf.set(o.id, PLANE_COLORS[i % PLANE_COLORS.length] as string));

  const refs: { ref: PlaneRef; id: string; color: string; isFace: boolean }[] = [
    ...planeObjs.map((o) => ({
      ref: { kind: 'plane', id: o.id } as PlaneRef,
      id: o.id,
      color: colorOf.get(o.id) as string,
      isFace: false,
    })),
    ...opts.facePlanes.map((face) => ({
      ref: { kind: 'face', face } as PlaneRef,
      id: `face:${face}`,
      color: FACE_PLANE_COLOR,
      isFace: true,
    })),
  ];

  const selectedPlanes = new Set<string>();
  const selectedPoints = new Set<ObjId>();
  if (opts.selected !== undefined && opts.selected !== null && c.has(opts.selected)) {
    const sel = c.get(opts.selected);
    if (sel.kind === 'line' && sel.origin.op === 'planeMeet') {
      for (const r of [sel.origin.a, sel.origin.b]) selectedPlanes.add(refKey(r));
      for (const id of c.meetThrough(sel.id)) selectedPoints.add(id);
    }
  }

  const sheets: SceneSheet[] = refs.map(({ ref, id, color, isFace }) => {
    const pl = c.planeOf(ref);
    const n = toArray(pl.n) as Vec;
    const cc = toNumber(pl.c);
    const poly3 = planeBoxPolygon(n, cc, frame);
    const points = poly3.map(scr.to);
    /* Перед какими гранями лежит лист: обрезка по полупространству
       снаружи грани и по её проекции. */
    const frontParts: P2[][] = [];
    poly.faces.forEach((f, fi) => {
      if (!(faces[fi] as SceneFace).front) return;
      const fn = toArray(f.plane.n) as Vec;
      const part3 = clipPolygonHalfspace(poly3, fn, toNumber(f.plane.c) + eps, true);
      if (part3.length < 3) return;
      const part = clipPolygon2(part3.map(scr.to), (faces[fi] as SceneFace).points);
      if (part.length >= 3) frontParts.push(part);
    });
    let origin: P2;
    if (ref.kind === 'face') {
      origin = centroid2((faces[ref.face] as SceneFace).points);
    } else {
      const o = c.plane(ref.id).origin;
      origin =
        o.op === 'plane3'
          ? centroid2([o.a, o.b, o.c].map((pid) => scr.to(toArray(c.point(pid).p) as Vec)))
          : centroid2(points);
    }
    const far = points.reduce(
      (best, p) =>
        Math.hypot(p[0] - figureCenter[0], p[1] - figureCenter[1]) >
        Math.hypot(best[0] - figureCenter[0], best[1] - figureCenter[1])
          ? p
          : best,
      points[0] ?? figureCenter,
    );
    const sc = centroid2(points);
    const label = { tex: c.planeTex(ref), p: vlerp2(far, sc, 0.16) };
    return {
      id,
      ref,
      color,
      points,
      frontParts,
      origin,
      label,
      isFace,
      highlighted: selectedPlanes.has(refKey(ref)),
    };
  });

  /* Параллельные плоскости: сообщение, общей линии нет. */
  let notice: string | null = null;
  for (let i = 0; i < refs.length && notice === null; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const A = c.planeOf((refs[i] as (typeof refs)[number]).ref);
      const B = c.planeOf((refs[j] as (typeof refs)[number]).ref);
      if (parallelPlanes(A, B) && !samePlane(A, B)) {
        notice = PARALLEL_NOTICE;
        break;
      }
    }
  }

  /* ── Сечения построенных плоскостей ──────────────────────── */

  const sections: SceneSection[] = [];
  if (showAll) {
    for (const o of planeObjs) {
      if (o.kind !== 'plane') continue;
      const s = coreSection(poly, o.plane);
      if (s.kind !== 'polygon') continue;
      const pts3 = s.vertices.map((v) => toArray(v.p) as Vec);
      const outline: Seg2[] = s.vertices.map((v, i) => {
        const w = at(s.vertices, (i + 1) % s.vertices.length);
        const common = v.faces.filter((fi) => w.faces.includes(fi));
        const visible = common.some((fi) => (faces[fi] as SceneFace).front);
        return {
          a: scr.to(pts3[i] as Vec),
          b: scr.to(pts3[(i + 1) % pts3.length] as Vec),
          visible,
        };
      });
      sections.push({
        planeId: o.id,
        color: colorOf.get(o.id) as string,
        points: pts3.map(scr.to),
        outline,
      });
    }
  }

  /* ── Прямые ───────────────────────────────────────────────── */

  const lines: SceneLine[] = [];
  const candidates: SceneCandidate[] = [];
  const sheetIdOf = (r: PlaneRef) => (r.kind === 'face' ? `face:${r.face}` : r.id);
  const sheetShown = (r: PlaneRef) => sheets.some((s) => s.id === sheetIdOf(r));

  for (const o of c.all()) {
    if (o.kind !== 'line' || !isShown(o.id)) continue;
    const g = o.origin;
    const p0 = toArray(o.line.p) as Vec;
    const d = toArray(o.line.dir) as Vec;
    if (g.op === 'planeMeet') {
      if (!showAll) continue;
      /* Линия живёт, пока на сцене обе её плоскости. */
      if (!sheetShown(g.a) || !sheetShown(g.b)) continue;
      const seg = clipLineBox(p0, d, frame);
      if (seg === null) continue;
      const runs = runsToSegs(scr, seg[0], seg[1], occs, eps);
      const through = c.meetThrough(o.id);
      const thr = through.map((pid) => scr.to(toArray(c.point(pid).p) as Vec));
      const ends: [P2, P2] = [scr.to(seg[0]), scr.to(seg[1])];
      const origin: P2 =
        thr.length === 2 ? mid2(thr[0] as P2, thr[1] as P2) : (thr[0] ?? mid2(ends[0], ends[1]));
      const colorA = sheets.find((s) => s.id === sheetIdOf(g.a))?.color ?? PLANE_COLORS[0];
      const colorB = sheets.find((s) => s.id === sheetIdOf(g.b))?.color ?? PLANE_COLORS[1];
      /* Подпись — у того конца, что дальше от фигуры, чуть внутрь. */
      const farEnd = ends[0][0] >= ends[1][0] ? ends[0] : ends[1];
      const nearEnd = farEnd === ends[0] ? ends[1] : ends[0];
      const lp = vlerp2(farEnd, nearEnd, 0.08);
      lines.push({
        id: o.id,
        kind: 'meet',
        runs,
        color: `color-mix(in srgb, ${colorA} 50%, ${colorB})`,
        label: { tex: c.lineTex(o.id), p: offsetAway(lp, figureCenter, 14) },
        through,
        origin,
        sheets: [sheetIdOf(g.a), sheetIdOf(g.b)],
        selected: opts.selected === o.id,
      });
      for (const h of c.lineEdgeHits(o.id)) {
        const p = toArray(h.p) as Vec;
        if (!insideBox(p, frame)) continue;
        /* Вершина тела или уже построенная точка — не кандидат. */
        if (
          c
            .all()
            .some(
              (q) =>
                q.kind === 'point' && isShown(q.id) && vlen(vsub(toArray(q.p) as Vec, p)) < 1e-9,
            )
        )
          continue;
        candidates.push({ lineId: o.id, p: scr.to(p), onSegment: h.onSegment, edge: h.edge });
      }
      continue;
    }
    if (g.op === 'edgeLine') {
      /* Продолжение ребра: только то, что за концами отрезка. */
      const e = at(poly.edges, g.edge);
      const A = verts[e.a] as Vec;
      const B = verts[e.b] as Vec;
      const dir = vsub(B, A);
      const seg = clipLineBox(A, dir, frame);
      if (seg === null) continue;
      const tOf = (p: Vec) => {
        const k = [0, 1, 2].find((i) => Math.abs(dir[i] as number) > 1e-12) as number;
        return ((p[k] as number) - (A[k] as number)) / (dir[k] as number);
      };
      const t0 = Math.min(tOf(seg[0]), tOf(seg[1]));
      const t1 = Math.max(tOf(seg[0]), tOf(seg[1]));
      const runs: Seg2[] = [];
      if (t0 < 0) runs.push(...runsToSegs(scr, vadd(A, vscale(dir, t0)), A, occs, eps));
      if (t1 > 1) runs.push(...runsToSegs(scr, B, vadd(A, vscale(dir, t1)), occs, eps));
      lines.push({
        id: o.id,
        kind: 'ext',
        runs,
        color: 'var(--graph-accent)',
        label: null,
        through: [],
        origin: scr.to(A),
        sheets: null,
        selected: false,
      });
      continue;
    }
    /* Прямая через две точки или параллельная: через всю рамку. */
    const seg = clipLineBox(p0, d, frame);
    if (seg === null) continue;
    const through = o.through === null ? [] : [...o.through];
    const origin =
      through.length === 2
        ? mid2(...(through.map((pid) => scr.to(toArray(c.point(pid).p) as Vec)) as [P2, P2]))
        : scr.to(p0);
    lines.push({
      id: o.id,
      kind: 'aux',
      runs: runsToSegs(scr, seg[0], seg[1], occs, eps),
      color: 'var(--graph-accent)',
      label: { tex: c.lineName(o.id), p: offsetAway(scr.to(seg[1]), figureCenter, 12) },
      through,
      origin,
      sheets: null,
      selected: false,
    });
  }

  /* ── Точки ────────────────────────────────────────────────── */

  const points: ScenePoint[] = [];
  for (const o of c.all()) {
    if (o.kind !== 'point' || !isShown(o.id)) continue;
    const p = scr.to(toArray(o.p) as Vec);
    const g = o.origin;
    const kind: ScenePoint['kind'] =
      g.op === 'vertex'
        ? 'vertex'
        : g.op === 'onEdge'
          ? 'onEdge'
          : g.op === 'free'
            ? 'free'
            : 'built';
    points.push({
      id: o.id,
      p,
      tex: o.name,
      kind,
      draggable: g.op === 'onEdge',
      edge: g.op === 'onEdge' ? g.edge : null,
      label: offsetAway(p, figureCenter, 16),
      highlighted: selectedPoints.has(o.id),
    });
  }

  spreadLabels(points, sheets, lines, size);

  return {
    size,
    faces,
    edges,
    sheets,
    sections,
    lines,
    points,
    candidates,
    notice,
    stepCount: steps.length,
  };
}

/* ── Подписи без наложений ───────────────────────────────────── */

type LabelBox = { x: number; y: number; w: number; h: number };

/** Ширина подписи в единицах viewBox: по числу «видимых» символов TeX. */
function texWidth(tex: string): number {
  const plain = tex
    .replace(/\\cap/g, 'n')
    .replace(/\\(alpha|beta|gamma|delta)/g, 'a')
    .replace(/[\\_{}^ ]/g, '');
  return 9 * Math.max(plain.length, 1) + 6;
}

const boxAt = (p: P2, w: number, h: number): LabelBox => ({
  x: p[0] - w / 2,
  y: p[1] - h / 2,
  w,
  h,
});

const overlaps = (a: LabelBox, b: LabelBox): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Подписи расставляются по очереди: точки, плоскости, линии. Если
 * подпись налезает на уже расставленные, она сдвигается: вниз, вверх,
 * ниже, выше… пока не найдётся свободное место (не больше шести
 * попыток). Раскладка детерминирована: одна и та же сцена даёт одни и
 * те же места, поэтому подписи не мигают при перерисовке.
 */
function spreadLabels(
  points: ScenePoint[],
  sheets: SceneSheet[],
  lines: SceneLine[],
  size: number,
): void {
  const placed: LabelBox[] = [];
  const movable: { p: P2; tex: string; set: (p: P2) => void }[] = [
    /* Сначала точки: их подписи важнее и сдвигаются друг от друга. */
    ...points.map((pt) => ({
      p: pt.label,
      tex: pt.tex,
      set: (p: P2) => {
        pt.label = p;
      },
    })),
    ...sheets.map((s) => ({
      p: s.label.p,
      tex: s.label.tex,
      set: (p: P2) => {
        s.label = { ...s.label, p };
      },
    })),
    ...lines.flatMap((l) =>
      l.label === null
        ? []
        : [
            {
              p: l.label.p,
              tex: l.label.tex,
              set: (p: P2) => {
                l.label = l.label === null ? null : { ...l.label, p };
              },
            },
          ],
    ),
  ];
  const step = 22;
  for (const m of movable) {
    const w = texWidth(m.tex);
    let best: P2 = m.p;
    for (let k = 0; k <= 6; k++) {
      const dy = k === 0 ? 0 : (k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2) * step;
      const cand: P2 = [
        Math.min(Math.max(m.p[0], w / 2 + 4), size - w / 2 - 4),
        Math.min(Math.max(m.p[1] + dy, 14), size - 14),
      ];
      const box = boxAt(cand, w, 22);
      if (!placed.some((b) => overlaps(b, box))) {
        best = cand;
        break;
      }
    }
    m.set(best);
    placed.push(boxAt(best, w, 22));
  }
}

const refKey = (r: PlaneRef): string => (r.kind === 'face' ? `face:${r.face}` : r.id);

const vlerp2 = (a: P2, b: P2, t: number): P2 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

function insideBox(p: Vec, box: Box3): boolean {
  return [0, 1, 2].every(
    (i) =>
      (p[i] as number) >= (box.min[i] as number) - 1e-9 &&
      (p[i] as number) <= (box.max[i] as number) + 1e-9,
  );
}
