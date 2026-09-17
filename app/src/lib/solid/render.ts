/**
 * Рендер модели в SVG.
 *
 * renderSolid(model) → строка SVG. Здесь и только здесь живёт
 * оформление: цвета — переменными дизайн-системы, без единого
 * хекса; толщины и отступы — в THEME. Всё, что рисуется, приходит
 * из модели через проекцию и расчёт видимости; вручную здесь не
 * рисуется ничего.
 */

import type { Body, Cone, Cylinder, Model, Polyhedron, Sphere } from './model';
import { faceNormal, polyhedronEdges } from './model';
import {
  SILHOUETTE,
  TOWARD,
  circlePoint,
  coneTangent,
  nearSide,
  project,
  spherePoint,
} from './project';
import {
  type Vec2,
  type Vec3,
  add,
  at,
  dist2,
  dot,
  lerp,
  mid,
  normalize,
  segmentDistance2,
  sub,
} from './vec';
import {
  type Occluder,
  occludersOf,
  polylineVisibility,
  segmentRuns,
  selfOccluders,
} from './visibility';

/* ══════════════════════════════════════════════════════════
   THEME — единственное место, где живёт оформление.
   Цвета только через токены дизайн-системы (tokens.css).
   ══════════════════════════════════════════════════════════ */
const THEME = {
  colors: {
    edge: 'var(--solid-edge)',
    face: 'var(--solid-face)',
    liquid: 'var(--solid-liquid)',
    aux: 'var(--graph-accent)',
    label: 'var(--color-text)',
    surface: 'var(--color-surface)',
  },
  width: {
    edge: 2,
    hidden: 1.6,
    aux: 1.7,
    auxHidden: 1.5,
    thin: 1.3,
    marker: 1.4,
    dotStroke: 1.6,
    halo: 3.2,
  },
  dash: {
    hidden: '6 4',
    aux: '5 4',
  },
  opacity: {
    /* Невидимое ребро — тот же цвет, светлее. */
    hidden: 0.62,
    face: 0.75,
    liquid: 0.85,
    section: 0.16,
    sphere: 0.5,
  },
  font: {
    family: 'var(--font-sans)',
    size: 15,
    weight: 600,
    sub: 10.5,
    subShift: 3.5,
    measure: 14,
    /* Оценка ширины символа в долях кегля: для расстановки подписей. */
    capital: 0.7,
    lower: 0.56,
    digit: 0.62,
  },
  geometry: {
    /* Чертёж вписывается в такой квадрат; толщины при этом в пикселях. */
    fit: 300,
    pad: 6,
    dot: 3.2,
    labelGap: 10,
    angle: 8,
    ellipsePoints: 96,
  },
} as const;

/* ── Внутренние примитивы чертежа (в пикселях) ─────────────────── */

type Role = 'edge' | 'aux' | 'section';

interface Stroke {
  points: Vec2[];
  role: Role;
  visible: boolean;
}

type FillRole = 'face' | 'liquid' | 'section' | 'sphere';

interface Fill {
  points: Vec2[];
  role: FillRole;
}

interface LabelSpec {
  p: Vec2;
  text: string;
  kind: 'vertex' | 'aux' | 'measure';
}

interface PlacedLabel extends LabelSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Angle {
  points: [Vec2, Vec2, Vec2];
}

interface Scene {
  strokes: Stroke[];
  fills: Fill[];
  dots: Vec2[];
  labels: LabelSpec[];
  angles: Angle[];
}

/* ── Сбор сцены из модели ──────────────────────────────────────── */

const TWO_PI = Math.PI * 2;

function ellipse(center: Vec3, r: number, from = 0, to = TWO_PI): Vec3[] {
  const n = THEME.geometry.ellipsePoints;
  const count = Math.max(2, Math.round((n * Math.abs(to - from)) / TWO_PI));
  return Array.from({ length: count + 1 }, (_, k) =>
    circlePoint(center, r, from + ((to - from) * k) / count),
  );
}

/** Ломаная по точкам с готовыми флагами видимости → куски. */
function polylineStrokes(
  points: Vec3[],
  visible: boolean[],
  role: Role,
  closed: boolean,
): Stroke[] {
  const out: Stroke[] = [];
  const n = points.length;
  const last = closed ? n : n - 1;
  let current: Vec2[] = [];
  let state: boolean | null = null;
  for (let i = 0; i < last; i += 1) {
    const a = at(points, i);
    const b = at(points, (i + 1) % n);
    const vis = at(visible, i) && at(visible, (i + 1) % n);
    if (state !== vis) {
      if (current.length > 1 && state !== null) {
        out.push({ points: current, role, visible: state });
      }
      current = [project(a)];
      state = vis;
    }
    current.push(project(b));
  }
  if (current.length > 1 && state !== null) {
    out.push({ points: current, role, visible: state });
  }
  return out;
}

function segmentStrokes(
  a: Vec3,
  b: Vec3,
  occluders: readonly Occluder[],
  eps: number,
  role: Role,
  skip?: (occ: Occluder) => boolean,
): Stroke[] {
  return segmentRuns(a, b, occluders, eps, skip).map((run) => ({
    points: [project(lerp(a, b, run.t0)), project(lerp(a, b, run.t1))],
    role,
    visible: run.visible,
  }));
}

function others(all: readonly Occluder[], body: Body): Occluder[] {
  return all.filter((occ) => occ.owner !== body);
}

function addPolyhedron(scene: Scene, body: Polyhedron, all: readonly Occluder[], eps: number) {
  const occluders = body.glass ? [...all, ...selfOccluders(body)] : all;
  polyhedronEdges(body.faces).forEach(([i, j]) => {
    const strokes = segmentStrokes(
      at(body.vertices, i),
      at(body.vertices, j),
      occluders,
      eps,
      'edge',
      (occ) => occ.kind === 'face' && occ.owner === body && occ.verts.has(i) && occ.verts.has(j),
    );
    scene.strokes.push(...strokes);
  });

  if (!body.noFill) {
    body.faces.forEach((face) => {
      if (dot(faceNormal(body.vertices, face), TOWARD) > 0) {
        scene.fills.push({ points: face.map((i) => project(at(body.vertices, i))), role: 'face' });
      }
    });
  }

  body.vertices.forEach((v, i) => {
    const name = body.names?.[i];
    if (name) {
      const p = project(v);
      scene.dots.push(p);
      scene.labels.push({ p, text: name, kind: 'vertex' });
    }
  });
}

function addCylinder(scene: Scene, body: Cylinder, all: readonly Occluder[], eps: number) {
  const occluders = others(all, body);
  const top: Vec3 = add(body.base, [0, 0, body.h]);
  const curve = (points: Vec3[], selfVisible: boolean[]) => {
    scene.strokes.push(
      ...polylineStrokes(
        points,
        polylineVisibility(points, selfVisible, occluders, eps),
        'edge',
        false,
      ),
    );
  };

  /* Нижнее основание: ближняя половина видна, дальняя за стенкой. */
  if (!body.hideBase) {
    const bottom = ellipse(body.base, body.r);
    curve(
      bottom,
      bottom.map((_, k) => nearSide((TWO_PI * k) / (bottom.length - 1))),
    );
  }
  const upper = ellipse(top, body.r);
  curve(
    upper,
    upper.map(() => true),
  );

  /* Контурные образующие: там, где луч зрения касается боковой поверхности. */
  [SILHOUETTE, SILHOUETTE + Math.PI].forEach((u) => {
    scene.strokes.push(
      ...segmentStrokes(
        circlePoint(body.base, body.r, u),
        circlePoint(top, body.r, u),
        occluders,
        eps,
        'edge',
      ),
    );
  });

  /* Силуэт: ближняя дуга низа, образующая, дальняя дуга верха. */
  scene.fills.push({
    points: [
      ...ellipse(body.base, body.r, SILHOUETTE + Math.PI, SILHOUETTE + TWO_PI),
      ...ellipse(top, body.r, SILHOUETTE, SILHOUETTE + Math.PI),
    ].map(project),
    role: 'face',
  });

  if (body.liquid !== undefined && body.liquid > 0) {
    const level: Vec3 = add(body.base, [0, 0, body.liquid]);
    const surface = ellipse(level, body.r);
    curve(
      surface,
      surface.map(() => true),
    );
    scene.fills.push({
      points: [
        ...ellipse(body.base, body.r, SILHOUETTE + Math.PI, SILHOUETTE + TWO_PI),
        ...ellipse(level, body.r, SILHOUETTE, SILHOUETTE + Math.PI),
      ].map(project),
      role: 'liquid',
    });
  }
}

/** Лежит ли угол на дуге от from до to (по возрастанию, с точностью до 2π). */
function inArc(u: number, from: number, to: number): boolean {
  const norm = (value: number) => ((value % TWO_PI) + TWO_PI) % TWO_PI;
  return norm(u - from) < norm(to - from);
}

function addCone(scene: Scene, body: Cone, all: readonly Occluder[], eps: number) {
  const occluders = others(all, body);
  const curve = (points: Vec3[], selfVisible: boolean[], role: Role = 'edge') => {
    scene.strokes.push(
      ...polylineStrokes(
        points,
        polylineVisibility(points, selfVisible, occluders, eps),
        role,
        false,
      ),
    );
  };
  const segment = (a: Vec3, b: Vec3) => {
    scene.strokes.push(...segmentStrokes(a, b, occluders, eps, 'edge'));
  };

  if (body.inverted) {
    /* Сосуд: вершина внизу, в открытое основание сверху видно целиком,
       а контурные образующие уходят на ближнюю сторону. */
    const apex: Vec3 = add(body.base, [0, 0, -body.h]);
    const psi = coneTangent(body.r, body.h);
    const left = SILHOUETTE + Math.PI + psi;
    const right = SILHOUETTE - psi;
    const base = ellipse(body.base, body.r);
    if (!body.hideBase) {
      curve(
        base,
        base.map(() => true),
      );
    }
    segment(apex, circlePoint(body.base, body.r, right));
    segment(apex, circlePoint(body.base, body.r, left));
    scene.fills.push({
      points: [project(apex), ...ellipse(body.base, body.r, right, left).map(project)],
      role: 'face',
    });
    if (body.liquid !== undefined && body.liquid > 0) {
      const level: Vec3 = add(apex, [0, 0, body.liquid]);
      const rl = (body.r * body.liquid) / body.h;
      const surface = ellipse(level, rl);
      curve(
        surface,
        surface.map(() => true),
      );
      scene.fills.push({
        points: [project(apex), ...ellipse(level, rl, right, left).map(project)],
        role: 'liquid',
      });
    }
    return;
  }

  /* Высота до вершины: у усечённого конуса она больше собственной. */
  const apexHeight = body.top === undefined ? body.h : (body.h * body.r) / (body.r - body.top);
  const psi = coneTangent(body.r, apexHeight);
  const right = SILHOUETTE + psi;
  const left = SILHOUETTE + Math.PI - psi;

  const base = ellipse(body.base, body.r);
  if (!body.hideBase) {
    const n = base.length - 1;
    curve(
      base,
      base.map((_, k) => !inArc((TWO_PI * k) / n, right, left)),
    );
  }

  if (body.top === undefined) {
    const apex: Vec3 = add(body.base, [0, 0, body.h]);
    segment(apex, circlePoint(body.base, body.r, right));
    segment(apex, circlePoint(body.base, body.r, left));
    scene.fills.push({
      points: [project(apex), ...ellipse(body.base, body.r, left, right + TWO_PI).map(project)],
      role: 'face',
    });
  } else {
    const topCenter: Vec3 = add(body.base, [0, 0, body.h]);
    const upper = ellipse(topCenter, body.top);
    curve(
      upper,
      upper.map(() => true),
    );
    segment(circlePoint(body.base, body.r, right), circlePoint(topCenter, body.top, right));
    segment(circlePoint(body.base, body.r, left), circlePoint(topCenter, body.top, left));
    scene.fills.push({
      points: [
        ...ellipse(body.base, body.r, left, right + TWO_PI),
        ...ellipse(topCenter, body.top, right, left),
      ].map(project),
      role: 'face',
    });
  }
}

function addSphere(scene: Scene, body: Sphere, all: readonly Occluder[], eps: number) {
  const occluders = others(all, body);

  /* Контур шара — большой круг, перпендикулярный лучу зрения. В косой
     проекции его образ не круг, а слегка вытянутый эллипс, и он
     получается сам: точки контура строятся в пространстве. */
  const n = THEME.geometry.ellipsePoints;
  const ring = Array.from({ length: n + 1 }, (_, k) =>
    spherePoint(body.center, body.r, (TWO_PI * k) / n),
  );
  scene.fills.push({ points: ring.map(project), role: 'sphere' });
  scene.strokes.push(
    ...polylineStrokes(
      ring,
      polylineVisibility(
        ring,
        ring.map(() => true),
        occluders,
        eps,
      ),
      'edge',
      false,
    ),
  );

  const horizontal = (z: number, r: number, role: Role) => {
    const center: Vec3 = add(body.center, [0, 0, z]);
    const pts = ellipse(center, r);
    const selfVisible = pts.map((p) => dot(sub(p, body.center), TOWARD) > 1e-9);
    scene.strokes.push(
      ...polylineStrokes(pts, polylineVisibility(pts, selfVisible, occluders, eps), role, false),
    );
    return pts;
  };

  if (body.equator !== false) {
    horizontal(0, body.r, 'edge');
  }
  (body.sections ?? []).forEach((z) => {
    const r = Math.sqrt(Math.max(0, body.r * body.r - z * z));
    const pts = horizontal(z, r, 'section');
    scene.fills.push({ points: pts.map(project), role: 'section' });
  });
}

function buildScene(model: Model): Scene {
  const scene: Scene = { strokes: [], fills: [], dots: [], labels: [], angles: [] };
  const all = occludersOf(model.bodies);
  const eps = modelExtent(model) * 1e-6;

  model.bodies.forEach((body) => {
    switch (body.kind) {
      case 'polyhedron':
        addPolyhedron(scene, body, all, eps);
        break;
      case 'cylinder':
        addCylinder(scene, body, all, eps);
        break;
      case 'cone':
        addCone(scene, body, all, eps);
        break;
      case 'sphere':
        addSphere(scene, body, all, eps);
        break;
    }
  });

  (model.sections ?? []).forEach((section) => {
    scene.fills.push({ points: section.points.map(project), role: 'section' });
    section.points.forEach((a, i) => {
      const b = at(section.points, (i + 1) % section.points.length);
      scene.strokes.push(...segmentStrokes(a, b, all, eps, 'section'));
    });
  });

  (model.lines ?? []).forEach((line) => {
    scene.strokes.push(...segmentStrokes(line.a, line.b, all, eps, 'aux'));
    if (line.label) {
      scene.labels.push({ p: project(mid(line.a, line.b)), text: line.label, kind: 'aux' });
    }
  });

  (model.marks ?? []).forEach((mark) => {
    const p = project(mark.p);
    scene.dots.push(p);
    if (mark.label) {
      scene.labels.push({ p, text: mark.label, kind: 'vertex' });
    }
  });

  (model.measures ?? []).forEach((measure) => {
    scene.labels.push({
      p: project(mid(measure.a, measure.b)),
      text: measure.text,
      kind: 'measure',
    });
  });

  (model.angles ?? []).forEach((angle) => {
    const o = project(angle.at);
    const u = project(add(angle.at, normalize(angle.u)));
    const v = project(add(angle.at, normalize(angle.v)));
    scene.angles.push({ points: [o, u, v] });
  });

  return scene;
}

/** Размер модели: для допусков и масштаба. */
function modelExtent(model: Model): number {
  let size = 0;
  model.bodies.forEach((body) => {
    switch (body.kind) {
      case 'polyhedron':
        body.vertices.forEach((v) => {
          size = Math.max(size, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
        });
        break;
      case 'cylinder':
      case 'cone':
        size = Math.max(size, body.r, body.h, ...body.base.map(Math.abs));
        break;
      case 'sphere':
        size = Math.max(size, body.r, ...body.center.map(Math.abs));
        break;
    }
  });
  return size || 1;
}

/* ── Масштаб и расстановка подписей ────────────────────────────── */

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function boxOf(points: Vec2[]): Box {
  const box: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  points.forEach((p) => {
    box.minX = Math.min(box.minX, p[0]);
    box.minY = Math.min(box.minY, p[1]);
    box.maxX = Math.max(box.maxX, p[0]);
    box.maxY = Math.max(box.maxY, p[1]);
  });
  return box;
}

/** Всё, что нарисовано, в пикселях: сцена вписана в квадрат fit. */
function toPixels(scene: Scene): Scene {
  const points = [
    ...scene.strokes.flatMap((s) => s.points),
    ...scene.fills.flatMap((f) => f.points),
    ...scene.dots,
    ...scene.labels.map((l) => l.p),
  ];
  const box = boxOf(points);
  const w = box.maxX - box.minX || 1;
  const h = box.maxY - box.minY || 1;
  const k = THEME.geometry.fit / Math.max(w, h);
  const map = (p: Vec2): Vec2 => [(p[0] - box.minX) * k, (p[1] - box.minY) * k];
  return {
    strokes: scene.strokes.map((s) => ({ ...s, points: s.points.map(map) })),
    fills: scene.fills.map((f) => ({ ...f, points: f.points.map(map) })),
    dots: scene.dots.map(map),
    labels: scene.labels.map((l) => ({ ...l, p: map(l.p) })),
    angles: scene.angles.map((a) => {
      const [o, u, v] = a.points.map(map) as [Vec2, Vec2, Vec2];
      /* Знак угла: стороны фиксированной длины в пикселях. */
      const side = THEME.geometry.angle;
      const du = normalize2(sub2(u, o));
      const dv = normalize2(sub2(v, o));
      return {
        points: [
          o,
          [o[0] + du[0] * side, o[1] + du[1] * side],
          [o[0] + dv[0] * side, o[1] + dv[1] * side],
        ],
      };
    }),
  };
}

function sub2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

function normalize2(a: Vec2): Vec2 {
  const len = Math.hypot(a[0], a[1]);
  return len === 0 ? [0, 0] : [a[0] / len, a[1] / len];
}

/** Имя вершины: буквы и индекс. */
function splitName(text: string): { base: string; sub: string } {
  const m = /^([^\d]+)(\d*)$/.exec(text);
  return m ? { base: m[1] ?? text, sub: m[2] ?? '' } : { base: text, sub: '' };
}

function labelSize(label: LabelSpec): { w: number; h: number } {
  const f = THEME.font;
  const size = label.kind === 'measure' ? f.measure : f.size;
  const { base, sub } = splitName(label.text);
  let w = 0;
  for (const ch of base) {
    if (/\d/.test(ch)) {
      w += f.digit * size;
    } else if (ch === ch.toUpperCase() && /[A-Za-zА-Яа-я]/.test(ch)) {
      w += f.capital * size;
    } else {
      w += f.lower * size;
    }
  }
  w += sub.length * f.digit * f.sub;
  return { w, h: size };
}

function rectSegmentDistance(x: number, y: number, w: number, h: number, a: Vec2, b: Vec2): number {
  const inside = (p: Vec2) => p[0] >= x && p[0] <= x + w && p[1] >= y && p[1] <= y + h;
  if (inside(a) || inside(b)) {
    return 0;
  }
  const corners: Vec2[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  let best = Infinity;
  for (let i = 0; i < 4; i += 1) {
    const c0 = at(corners, i);
    const c1 = at(corners, (i + 1) % 4);
    if (segmentsCross(c0, c1, a, b)) {
      return 0;
    }
    best = Math.min(best, segmentDistance2(c0, a, b), segmentDistance2(c1, a, b));
  }
  return Math.min(best, pointRectDistance(a, x, y, w, h), pointRectDistance(b, x, y, w, h));
}

function pointRectDistance(p: Vec2, x: number, y: number, w: number, h: number): number {
  const dx = Math.max(x - p[0], 0, p[0] - x - w);
  const dy = Math.max(y - p[1], 0, p[1] - y - h);
  return Math.hypot(dx, dy);
}

function segmentsCross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const orient = (p: Vec2, q: Vec2, r: Vec2) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return orient(a, b, c) !== orient(a, b, d) && orient(c, d, a) !== orient(c, d, b);
}

const DIRECTIONS: Vec2[] = Array.from({ length: 16 }, (_, k) => {
  const u = (TWO_PI * k) / 16;
  return [Math.cos(u), Math.sin(u)];
});

/**
 * Расстановка подписей.
 *
 * У каждой подписи перебираются направления вокруг точки; место
 * выбирается по штрафам: за линию, проходящую сквозь подпись, за
 * наложение на другую подпись и на точку, и за уход внутрь фигуры
 * (снаружи подпись читается лучше).
 */
function placeLabels(scene: Scene): PlacedLabel[] {
  /* Линии по штрихам: одна линия, сколько бы кусков в ней ни было,
     штрафует один раз — иначе эллипс из сотни отрезков перевешивал бы
     любое ребро. */
  const strokes: [Vec2, Vec2][][] = scene.strokes.map((s) => {
    const list: [Vec2, Vec2][] = [];
    for (let i = 0; i + 1 < s.points.length; i += 1) {
      list.push([at(s.points, i), at(s.points, i + 1)]);
    }
    return list;
  });
  const anchors = scene.labels.map((l) => l.p);
  const center: Vec2 = anchors.length
    ? [
        anchors.reduce((s, p) => s + p[0], 0) / anchors.length,
        anchors.reduce((s, p) => s + p[1], 0) / anchors.length,
      ]
    : [0, 0];

  const placed: PlacedLabel[] = [];
  const clear = 2.5;
  const gap = THEME.geometry.labelGap;

  scene.labels.forEach((label) => {
    const { w, h } = labelSize(label);
    let outward = normalize2(sub2(label.p, center));
    if (outward[0] === 0 && outward[1] === 0) {
      outward = [0, 1];
    }
    let best: PlacedLabel | null = null;
    let bestScore = Infinity;

    [gap, gap + 8, gap + 16].forEach((reachBase, ring) => {
      DIRECTIONS.forEach((dir) => {
        const reach = reachBase + Math.abs(dir[0]) * (w / 2) + Math.abs(dir[1]) * (h / 2);
        const cx = label.p[0] + dir[0] * reach;
        const cy = label.p[1] + dir[1] * reach;
        const x = cx - w / 2;
        const y = cy - h / 2;
        let score = ring * 5;
        score += 3 * (1 - (dir[0] * outward[0] + dir[1] * outward[1]));

        strokes.forEach((segments) => {
          const crosses = segments.some(
            ([a, b]) =>
              rectSegmentDistance(x - clear, y - clear, w + 2 * clear, h + 2 * clear, a, b) < 0.001,
          );
          if (crosses) {
            score += 40;
          }
        });
        scene.dots.forEach((dot2) => {
          if (
            dist2(dot2, label.p) > 0.001 &&
            pointRectDistance(dot2, x, y, w, h) < THEME.geometry.dot + 1
          ) {
            score += 30;
          }
        });
        placed.forEach((other) => {
          if (
            x < other.x + other.w + 2 &&
            x + w + 2 > other.x &&
            y < other.y + other.h + 2 &&
            y + h + 2 > other.y
          ) {
            score += 60;
          }
        });

        if (score < bestScore) {
          bestScore = score;
          best = { ...label, x, y, w, h };
        }
      });
    });
    if (best) {
      placed.push(best);
    }
  });
  return placed;
}

/* ── Вывод SVG ─────────────────────────────────────────────────── */

function px(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function pathOf(points: Vec2[], closed = false): string {
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0])} ${px(p[1])}`).join('');
  return closed ? `${d}Z` : d;
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function strokeAttrs(s: Stroke): string {
  const c = THEME.colors;
  const w = THEME.width;
  if (s.role === 'edge') {
    return s.visible
      ? `stroke="${c.edge}" stroke-width="${w.edge}"`
      : `stroke="${c.edge}" stroke-width="${w.hidden}" stroke-opacity="${THEME.opacity.hidden}" stroke-dasharray="${THEME.dash.hidden}"`;
  }
  return s.visible
    ? `stroke="${c.aux}" stroke-width="${w.aux}"`
    : `stroke="${c.aux}" stroke-width="${w.auxHidden}" stroke-dasharray="${THEME.dash.aux}"`;
}

function fillAttrs(f: Fill): string {
  const c = THEME.colors;
  const o = THEME.opacity;
  switch (f.role) {
    case 'face':
      return `fill="${c.face}" fill-opacity="${o.face}"`;
    case 'sphere':
      return `fill="${c.face}" fill-opacity="${o.sphere}"`;
    case 'liquid':
      return `fill="${c.liquid}" fill-opacity="${o.liquid}"`;
    case 'section':
      return `fill="${c.aux}" fill-opacity="${o.section}"`;
  }
}

function labelMarkup(label: PlacedLabel): string {
  const f = THEME.font;
  const { base, sub } = splitName(label.text);
  const size = label.kind === 'measure' ? f.measure : f.size;
  const fill = label.kind === 'aux' ? THEME.colors.aux : THEME.colors.label;
  const style = label.kind === 'aux' ? ' font-style="italic"' : '';
  const x = label.x;
  const y = label.y + label.h * 0.78;
  const inner = sub
    ? `${esc(base)}<tspan font-size="${f.sub}" dy="${f.subShift}">${esc(sub)}</tspan>`
    : esc(base);
  return (
    `<text x="${px(x)}" y="${px(y)}" font-family="${f.family}" font-size="${size}" font-weight="${f.weight}"${style} ` +
    `fill="${fill}" paint-order="stroke" stroke="${THEME.colors.surface}" stroke-width="${THEME.width.halo}" stroke-linejoin="round">${inner}</text>`
  );
}

/** Модель → SVG. */
export function renderSolid(model: Model): string {
  const scene = toPixels(buildScene(model));
  const labels = placeLabels(scene);

  const pad = THEME.geometry.pad;
  const box = boxOf([
    ...scene.strokes.flatMap((s) => s.points),
    ...scene.fills.flatMap((f) => f.points),
    ...scene.angles.flatMap((a) => a.points),
    ...scene.dots.map((p): Vec2 => [p[0] - THEME.geometry.dot, p[1] - THEME.geometry.dot]),
    ...scene.dots.map((p): Vec2 => [p[0] + THEME.geometry.dot, p[1] + THEME.geometry.dot]),
    ...labels.map((l): Vec2 => [l.x - 2, l.y - 2]),
    ...labels.map((l): Vec2 => [l.x + l.w + 2, l.y + l.h + 2]),
  ]);
  const x0 = box.minX - pad;
  const y0 = box.minY - pad;
  const width = box.maxX - box.minX + 2 * pad;
  const height = box.maxY - box.minY + 2 * pad;

  const order = (list: Stroke[], role: Role, visible: boolean) =>
    list.filter((s) => s.role === role && s.visible === visible);

  const parts: string[] = [];
  scene.fills
    .filter((f) => f.role === 'face' || f.role === 'sphere')
    .forEach((f) =>
      parts.push(`<path d="${pathOf(f.points, true)}" ${fillAttrs(f)} stroke="none"/>`),
    );
  scene.fills
    .filter((f) => f.role === 'liquid' || f.role === 'section')
    .forEach((f) =>
      parts.push(`<path d="${pathOf(f.points, true)}" ${fillAttrs(f)} stroke="none"/>`),
    );

  const strokeLayers: [Role, boolean][] = [
    ['edge', false],
    ['aux', false],
    ['section', false],
    ['edge', true],
    ['aux', true],
    ['section', true],
  ];
  strokeLayers.forEach(([role, visible]) => {
    order(scene.strokes, role, visible).forEach((s) => {
      parts.push(
        `<path d="${pathOf(s.points)}" fill="none" ${strokeAttrs(s)} stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    });
  });

  scene.angles.forEach((a) => {
    const [o, u, v] = a.points;
    const corner: Vec2 = [u[0] + v[0] - o[0], u[1] + v[1] - o[1]];
    parts.push(
      `<path d="${pathOf([u, corner, v])}" fill="none" stroke="${THEME.colors.aux}" stroke-width="${THEME.width.marker}" stroke-linejoin="round"/>`,
    );
  });

  scene.dots.forEach((p) => {
    parts.push(
      `<circle cx="${px(p[0])}" cy="${px(p[1])}" r="${THEME.geometry.dot}" fill="${THEME.colors.edge}" stroke="${THEME.colors.surface}" stroke-width="${THEME.width.dotStroke}"/>`,
    );
  });

  labels.forEach((label) => parts.push(labelMarkup(label)));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px(x0)} ${px(y0)} ${px(width)} ${px(height)}" ` +
    `width="${px(width)}" height="${px(height)}" role="img" aria-label="${esc(model.alt)}" class="solid">` +
    `<title>${esc(model.alt)}</title>${parts.join('')}</svg>`
  );
}

export { THEME as SOLID_THEME };
