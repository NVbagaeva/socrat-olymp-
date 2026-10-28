/**
 * Рендер модели в SVG.
 *
 * renderSolid(model) → строка SVG. Здесь и только здесь живёт
 * оформление: цвета — переменными дизайн-системы, без единого
 * хекса; толщины и отступы — в THEME. Всё, что рисуется, приходит
 * из модели через проекцию и расчёт видимости; вручную здесь не
 * рисуется ничего.
 */

import { BUKVY, CHISLA, VES, indeksSvg, shirinaIndeksa } from '../risunki/shrifty.js';
import type { Body, Cone, Cylinder, Model, Polyhedron, Sphere } from './model';
import { faceNormal, polyhedronEdges } from './model';
import { type View, orthoAt, viewOf } from './project';
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
  hidden,
  occludersOf,
  polylineRuns,
  segmentRuns,
  selfOccluders,
} from './visibility';

/* ══════════════════════════════════════════════════════════
   THEME — единственное место, где живёт оформление.

   Все стили — атрибутами прямо в SVG и значениями, а не токенами
   var(--…): рисунок не зависит от CSS страницы и одинаков на сайте,
   на листе, в PDF, в предпросмотре и на сводном листе. (Раньше цвета
   были var(--solid-edge) и т. п. без запасного значения: вне страниц,
   где токены не заданы, заливка становилась чёрной по умолчанию SVG,
   а рёбра пропадали — тело печаталось чёрной кляксой.)

   Значения — токены сайта из styles/tokens.css: тёмный текст
   (--color-text), синий (--color-primary), терракота (--graph-accent).
   Внешнее (стеклянное) тело и одиночное тело — тёмные, вписанное —
   синее. Заливки — только лёгкие, полупрозрачность не больше 0,1.
   ══════════════════════════════════════════════════════════ */
const THEME = {
  colors: {
    edge: '#101728',
    inner: '#1f5fd0',
    face: '#1f5fd0',
    liquid: '#1f5fd0',
    aux: '#e07a2f',
    label: '#101728',
    surface: '#ffffff',
  },
  /* Толщины — в единицах рисунка: чертёж шириной около 330 единиц
     печатается шириной около 64 мм, это PT единиц в pt. На бумаге
     видимые линии 1,2–1,5 pt, невидимые 0,8–1 pt штрихом 4/3 pt; лист
     пересчитывает их под итоговую ширину (data-line-pt, figureRules.js). */
  width: {
    edge: 2.45,
    hidden: 1.64,
    aux: 2.3,
    auxHidden: 1.64,
    thin: 1.3,
    marker: 2.2,
    dotStroke: 1.6,
    halo: 3.2,
    /* Элемент текущего шага решения: толще остальных (1,5 pt). */
    hl: 2.73,
    hlHidden: 1.8,
    hlMarker: 2.73,
  },
  dash: {
    hidden: '7.28 5.46',
    aux: '7.28 5.46',
  },
  opacity: {
    /* Невидимое ребро — тот же цвет, светлее. */
    hidden: 0.7,
    /* Заливки: только лёгкий оттенок, не больше 0,1. */
    face: 0.06,
    liquid: 0.1,
    section: 0.08,
    sphere: 0.08,
    sectionHl: 0.1,
  },
  /* Подписи — шрифтом KaTeX, как в условии: имена курсивом KaTeX_Math,
     числа прямым KaTeX_Main, не жирно; индекс — 70 % ниже строки;
     кегль на бумаге не меньше 10 pt. */
  font: {
    /* Шрифты — общие для рисунков сайта (lib/risunki/shrifty). */
    family: CHISLA,
    familyName: BUKVY,
    size: 19,
    /* Живой чертёж — только экран: кегль 15 px, как прежде. */
    liveSize: 15,
    weight: VES,
    measure: 19,
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
    /* Поле вокруг живого чертежа: при вращении подписи не обрезаются. */
    liveMargin: 26,
  },
} as const;

/* ── Внутренние примитивы чертежа (в пикселях) ─────────────────── */

type Role = 'edge' | 'aux' | 'section';

/** Чьё это: вписанное тело — синее, внешнее и одиночное — тёмное. */
type Ton = 'inner' | 'outer';

interface Stroke {
  points: Vec2[];
  role: Role;
  visible: boolean;
  ton?: Ton;
  /** Элемент текущего шага решения. */
  hl?: boolean;
  /** Прямой отрезок в пространстве, кусок которого это: для метрик вида (vid.ts). */
  seg?: { a: Vec3; b: Vec3 };
  /** Тот же кусок в пространстве и тело, чья это линия: для проверки видимости. */
  p3?: Vec3[];
  owner?: number;
  /** Уровень жидкости в сосуде: стенки сосуда его не прячут (сосуд прозрачен). */
  liquid?: boolean;
}

type FillRole = 'face' | 'liquid' | 'section' | 'sphere';

interface Fill {
  points: Vec2[];
  /**
   * Ещё контуры той же заливки: смежные грани одной плоскости или одной
   * кривой поверхности рисуются одним путём — без швов между ними.
   */
  dop?: Vec2[][];
  role: FillRole;
  hl?: boolean;
  ton?: Ton;
  /** Стеклянное внешнее тело: без заливки. */
  steklo?: boolean;
}

interface LabelSpec {
  p: Vec2;
  text: string;
  kind: 'vertex' | 'aux' | 'measure';
  hl?: boolean;
  /** Точка в пространстве (вершина, пометка): для метрик вида. */
  p3?: Vec3;
  /** Кегль, единицы рисунка: у живого чертежа мельче (только экран). */
  size?: number;
  /** Точка закрыта телом от зрителя: подпись видна, но бледнее. */
  skryt?: boolean;
}

interface PlacedLabel extends LabelSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Angle {
  points: [Vec2, Vec2, Vec2];
  hl?: boolean;
}

interface Scene {
  strokes: Stroke[];
  fills: Fill[];
  dots: Vec2[];
  labels: LabelSpec[];
  angles: Angle[];
  /** Цели касания («нажми на чертеже»): только если их просили. */
  celi?: { id: string; points: Vec2[]; on: boolean }[];
  /** Контур основания первого тела: для метрик вида. */
  base?: Vec2[];
}

/* ── Сбор сцены из модели ──────────────────────────────────────── */

/** Вид модели: выбранный ракурс (model.rakurs, lib/solid/vid.ts) или вид по умолчанию. */
export function modelView(model: Pick<Model, 'view' | 'rakurs'>): View {
  return model.rakurs !== undefined && model.view !== 'cabinet'
    ? orthoAt(model.rakurs.azimuth, model.rakurs.elevation)
    : viewOf(model.view);
}

const TWO_PI = Math.PI * 2;

function ellipse(view: View, center: Vec3, r: number, from = 0, to = TWO_PI): Vec3[] {
  const n = THEME.geometry.ellipsePoints;
  const count = Math.max(2, Math.round((n * Math.abs(to - from)) / TWO_PI));
  return Array.from({ length: count + 1 }, (_, k) =>
    view.circlePoint(center, r, from + ((to - from) * k) / count),
  );
}

/**
 * Своя видимость точек края поверхности вращения — правилом граней,
 * как у ребра многогранника: точка края видна, если к зрителю повёрнута
 * хотя бы одна из двух поверхностей, которые в ней сходятся, — плоское
 * основание (нормаль capZ по вертикали, 0 — основания нет) или боковая
 * поверхность (наружная нормаль: от оси по горизонтали и slope по
 * вертикали). Так считается при любом ракурсе, и снизу тоже.
 */
function rimVisible(
  view: View,
  points: readonly Vec3[],
  center: Vec3,
  capZ: -1 | 0 | 1,
  slope: number,
): boolean[] {
  const t = view.toward;
  return points.map((p) => {
    const dx = p[0] - center[0];
    const dy = p[1] - center[1];
    const rho = Math.hypot(dx, dy);
    const side = dx * t[0] + dy * t[1] + slope * rho * t[2];
    return (capZ !== 0 && capZ * t[2] > 1e-9) || side >= -1e-9 * Math.max(rho, 1);
  });
}

/** Кривая с флагами своей видимости точек → куски с заслонением чужими телами. */
function curveStrokes(
  view: View,
  points: Vec3[],
  selfVisible: boolean[],
  occluders: readonly Occluder[],
  eps: number,
  role: Role,
): Stroke[] {
  return polylineRuns(view, points, selfVisible, occluders, eps).map((run) => ({
    points: run.points.map(view.project),
    role,
    visible: run.visible,
    p3: run.points,
  }));
}

function segmentStrokes(
  view: View,
  a: Vec3,
  b: Vec3,
  occluders: readonly Occluder[],
  eps: number,
  role: Role,
  skip?: (occ: Occluder) => boolean,
): Stroke[] {
  const seg = { a, b };
  return segmentRuns(view, a, b, occluders, eps, skip).map((run) => ({
    points: [view.project(lerp(a, b, run.t0)), view.project(lerp(a, b, run.t1))],
    role,
    visible: run.visible,
    seg,
    p3: [lerp(a, b, run.t0), lerp(a, b, run.t1)],
  }));
}

/** Уровень жидкости: виден сквозь стенку сосуда целиком — так рисуют сосуд. */
function liquidCurve(scene: Scene, draw: () => void) {
  const from = scene.strokes.length;
  draw();
  for (let i = from; i < scene.strokes.length; i += 1) (scene.strokes[i] as Stroke).liquid = true;
}

function others(all: readonly Occluder[], body: Body): Occluder[] {
  return all.filter((occ) => occ.owner !== body);
}

/** Ребро «i-j» (i < j) → грани, в которые оно входит. */
function rebraKGranyam(faces: readonly (readonly number[])[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  faces.forEach((face, f) => {
    face.forEach((a, k) => {
      const b = at(face, (k + 1) % face.length);
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const list = map.get(key);
      if (list === undefined) map.set(key, [f]);
      else list.push(f);
    });
  });
  return map;
}

/**
 * Рисовать ли ребро между гранями: стык двух граней одной плоскости —
 * не ребро; стык двух полосок кривой поверхности — только контур.
 */
function rebroTela(
  grani: readonly number[],
  normals: readonly Vec3[],
  gladkie: ReadonlySet<number>,
  view: View,
): boolean {
  if (grani.length !== 2) return true;
  const [f, g] = grani as [number, number];
  const [nf, ng] = [at(normals, f), at(normals, g)];
  if (dot(nf, ng) > 1 - 1e-9) return false;
  if (gladkie.has(f) && gladkie.has(g)) {
    return dot(nf, view.toward) > 0 !== dot(ng, view.toward) > 0;
  }
  return true;
}

/** Ключ плоскости грани: единичная нормаль и расстояние до начала. */
function ploskost(n: Vec3, p: Vec3): string {
  const r = (x: number) => (Math.round(x * 1e6) / 1e6 + 0).toFixed(6);
  return [n[0], n[1], n[2], dot(n, p)].map(r).join(',');
}

function addPolyhedron(
  view: View,
  scene: Scene,
  body: Polyhedron,
  all: readonly Occluder[],
  eps: number,
) {
  const occluders = body.glass ? [...all, ...selfOccluders(view, body)] : all;
  const normals = body.faces.map((face) => normalize(faceNormal(body.vertices, face)));
  const gladkie = new Set(body.gladkie ?? []);
  const kGrani = rebraKGranyam(body.faces);
  polyhedronEdges(body.faces).forEach(([i, j]) => {
    if (!rebroTela(kGrani.get(`${i}-${j}`) ?? [], normals, gladkie, view)) return;
    const strokes = segmentStrokes(
      view,
      at(body.vertices, i),
      at(body.vertices, j),
      occluders,
      eps,
      'edge',
      (occ) => occ.kind === 'face' && occ.owner === body && occ.verts.has(i) && occ.verts.has(j),
    );
    scene.strokes.push(...strokes);
  });

  if (scene.base === undefined && body.vertices.length > 0) {
    const zmin = Math.min(...body.vertices.map((v) => v[2]));
    scene.base = body.vertices.filter((v) => Math.abs(v[2] - zmin) < 1e-9).map(view.project);
  }
  if (!body.noFill) {
    /* Видимые грани одной плоскости или одной кривой поверхности —
       одной заливкой (контуры одного пути): иначе на стыках швы. */
    const gruppy = new Map<string, Vec2[][]>();
    body.faces.forEach((face, f) => {
      if (dot(faceNormal(body.vertices, face), view.toward) <= 0) return;
      const kontur = face.map((i) => view.project(at(body.vertices, i)));
      const klyuch = gladkie.has(f) ? 'gladko' : ploskost(at(normals, f), at(body.vertices, at(face, 0)));
      const gruppa = gruppy.get(klyuch);
      if (gruppa === undefined) gruppy.set(klyuch, [kontur]);
      else gruppa.push(kontur);
    });
    gruppy.forEach(([pervyy, ...dop]) => {
      scene.fills.push({
        points: pervyy as Vec2[],
        ...(dop.length > 0 ? { dop } : {}),
        role: 'face',
      });
    });
  }

  body.vertices.forEach((v, i) => {
    const name = body.names?.[i];
    if (name) {
      const p = view.project(v);
      scene.dots.push(p);
      scene.labels.push({
        p,
        text: name,
        kind: 'vertex',
        p3: v,
        ...(hidden(view, v, occluders, eps) ? { skryt: true } : {}),
      });
    }
  });
}

function addCylinder(
  view: View,
  scene: Scene,
  body: Cylinder,
  all: readonly Occluder[],
  eps: number,
) {
  const occluders = others(all, body);
  const top: Vec3 = add(body.base, [0, 0, body.h]);
  scene.base ??= ellipse(view, body.base, body.r).map(view.project);
  const curve = (points: Vec3[], selfVisible: boolean[]) => {
    scene.strokes.push(...curveStrokes(view, points, selfVisible, occluders, eps, 'edge'));
  };

  /* Основания: край виден, где к зрителю повёрнуто основание или
     боковая стенка (rimVisible). */
  if (!body.hideBase) {
    const bottom = ellipse(view, body.base, body.r);
    curve(bottom, rimVisible(view, bottom, body.base, -1, 0));
  }
  const upper = ellipse(view, top, body.r);
  curve(upper, rimVisible(view, upper, top, 1, 0));

  /* Контурные образующие: там, где луч зрения касается боковой поверхности. */
  [view.silhouette, view.silhouette + Math.PI].forEach((u) => {
    scene.strokes.push(
      ...segmentStrokes(
        view,
        view.circlePoint(body.base, body.r, u),
        view.circlePoint(top, body.r, u),
        occluders,
        eps,
        'edge',
      ),
    );
  });

  /* Силуэт: ближняя дуга низа, образующая, дальняя дуга верха. */
  scene.fills.push({
    points: [
      ...ellipse(view, body.base, body.r, view.silhouette + Math.PI, view.silhouette + TWO_PI),
      ...ellipse(view, top, body.r, view.silhouette, view.silhouette + Math.PI),
    ].map(view.project),
    role: 'face',
  });

  if (body.liquid !== undefined && body.liquid > 0) {
    const level: Vec3 = add(body.base, [0, 0, body.liquid]);
    const surface = ellipse(view, level, body.r);
    liquidCurve(scene, () =>
      curve(
        surface,
        surface.map(() => true),
      ),
    );
    scene.fills.push({
      points: [
        ...ellipse(view, body.base, body.r, view.silhouette + Math.PI, view.silhouette + TWO_PI),
        ...ellipse(view, level, body.r, view.silhouette, view.silhouette + Math.PI),
      ].map(view.project),
      role: 'liquid',
    });
  }
}

function addCone(view: View, scene: Scene, body: Cone, all: readonly Occluder[], eps: number) {
  const occluders = others(all, body);
  scene.base ??= ellipse(view, body.base, body.r).map(view.project);
  const curve = (points: Vec3[], selfVisible: boolean[], role: Role = 'edge') => {
    scene.strokes.push(...curveStrokes(view, points, selfVisible, occluders, eps, role));
  };
  const segment = (a: Vec3, b: Vec3) => {
    scene.strokes.push(...segmentStrokes(view, a, b, occluders, eps, 'edge'));
  };

  if (body.inverted) {
    /* Сосуд: вершина внизу, в открытое основание сверху видно целиком,
       а контурные образующие уходят на ближнюю сторону. */
    const apex: Vec3 = add(body.base, [0, 0, -body.h]);
    const psi = view.coneTangent(body.r, body.h);
    const left = view.silhouette + Math.PI + psi;
    const right = view.silhouette - psi;
    const base = ellipse(view, body.base, body.r);
    if (!body.hideBase) {
      /* Открытый край сосуда: основание смотрит вверх, стенка — наружу и вниз. */
      curve(base, rimVisible(view, base, body.base, 1, -body.r / body.h));
    }
    segment(apex, view.circlePoint(body.base, body.r, right));
    segment(apex, view.circlePoint(body.base, body.r, left));
    scene.fills.push({
      points: [
        view.project(apex),
        ...ellipse(view, body.base, body.r, right, left).map(view.project),
      ],
      role: 'face',
    });
    if (body.liquid !== undefined && body.liquid > 0) {
      const level: Vec3 = add(apex, [0, 0, body.liquid]);
      const rl = (body.r * body.liquid) / body.h;
      const surface = ellipse(view, level, rl);
      liquidCurve(scene, () =>
        curve(
          surface,
          surface.map(() => true),
        ),
      );
      scene.fills.push({
        points: [view.project(apex), ...ellipse(view, level, rl, right, left).map(view.project)],
        role: 'liquid',
      });
    }
    return;
  }

  /* Высота до вершины: у усечённого конуса она больше собственной. */
  const apexHeight = body.top === undefined ? body.h : (body.h * body.r) / (body.r - body.top);
  const psi = view.coneTangent(body.r, apexHeight);
  const right = view.silhouette + psi;
  const left = view.silhouette + Math.PI - psi;

  const base = ellipse(view, body.base, body.r);
  if (!body.hideBase) {
    /* Видна дуга между контурными образующими (right, left) — та, где
       боковая поверхность повёрнута к зрителю. */
    curve(base, rimVisible(view, base, body.base, -1, body.r / apexHeight));
  }

  if (body.top === undefined) {
    const apex: Vec3 = add(body.base, [0, 0, body.h]);
    segment(apex, view.circlePoint(body.base, body.r, right));
    segment(apex, view.circlePoint(body.base, body.r, left));
    scene.fills.push({
      points: [
        view.project(apex),
        ...ellipse(view, body.base, body.r, left, right + TWO_PI).map(view.project),
      ],
      role: 'face',
    });
  } else {
    const topCenter: Vec3 = add(body.base, [0, 0, body.h]);
    const upper = ellipse(view, topCenter, body.top);
    curve(upper, rimVisible(view, upper, topCenter, 1, body.r / apexHeight));
    segment(
      view.circlePoint(body.base, body.r, right),
      view.circlePoint(topCenter, body.top, right),
    );
    segment(view.circlePoint(body.base, body.r, left), view.circlePoint(topCenter, body.top, left));
    scene.fills.push({
      points: [
        ...ellipse(view, body.base, body.r, left, right + TWO_PI),
        ...ellipse(view, topCenter, body.top, right, left),
      ].map(view.project),
      role: 'face',
    });
  }
}

function addSphere(view: View, scene: Scene, body: Sphere, all: readonly Occluder[], eps: number) {
  const occluders = others(all, body);

  /* Контур шара — большой круг, перпендикулярный лучу зрения. В косой
     проекции его образ не круг, а слегка вытянутый эллипс, и он
     получается сам: точки контура строятся в пространстве. */
  const n = THEME.geometry.ellipsePoints;
  const ring = Array.from({ length: n + 1 }, (_, k) =>
    view.spherePoint(body.center, body.r, (TWO_PI * k) / n),
  );
  scene.fills.push({ points: ring.map(view.project), role: 'sphere' });
  scene.strokes.push(
    ...curveStrokes(
      view,
      ring,
      ring.map(() => true),
      occluders,
      eps,
      'edge',
    ),
  );

  const horizontal = (z: number, r: number, role: Role) => {
    const center: Vec3 = add(body.center, [0, 0, z]);
    const pts = ellipse(view, center, r);
    const selfVisible = pts.map((p) => dot(sub(p, body.center), view.toward) > 1e-9);
    scene.strokes.push(...curveStrokes(view, pts, selfVisible, occluders, eps, role));
    return pts;
  };

  if (body.equator !== false) {
    horizontal(0, body.r, 'edge');
  }
  (body.sections ?? []).forEach((z) => {
    const r = Math.sqrt(Math.max(0, body.r * body.r - z * z));
    const pts = horizontal(z, r, 'section');
    scene.fills.push({ points: pts.map(view.project), role: 'section' });
  });
}

/**
 * Как рисовать модель. Без опций — статичный чертёж в виде модели,
 * все элементы, масштаб по рамке рисунка: так рисуются банк, теория
 * и печать.
 */
export interface RenderOptions {
  /** Свой вид вместо вида модели: живой чертёж под углом ученика. */
  view?: View;
  /**
   * Шаг решения: элементы с бóльшим шагом не рисуются, элементы
   * этого шага выделены. Не задан — видно всё, без выделения.
   */
  shag?: number;
  /**
   * Постоянный масштаб и рамка: чертёж вписан по описанной сфере
   * модели, поэтому при вращении не прыгает и не «дышит».
   */
  ustoychivo?: boolean;
  /**
   * Цели касания для задач «нажми на чертеже»: отрезок (две точки) или
   * многоугольник. Рисуются поверх чертежа прозрачной широкой полосой
   * с data-cel; выбранные (vybrano) — подсвечены. Без целей разметка
   * чертежа не меняется.
   */
  celi?: readonly { id: string; points: readonly Vec3[] }[];
  vybrano?: readonly string[];
  /**
   * Ширина полосы касания цели, единицы рисунка (по умолчанию 22).
   * Экран пересчитывает её под масштаб рисунка: на телефоне полоса
   * не уже 44 px.
   */
  celShirina?: number;
  /**
   * Тема оформления. «pechat» (по умолчанию) — строгий чертёж банка,
   * листов и PDF: плоская заливка, сплошные точки вершин, выделенная
   * фигура не плотнее 0,15. «ekran» — «стекло» новых экранов №3:
   * полупрозрачные грани с лёгким градиентом, пустые кружки вершин,
   * выделенная фигура оранжевой заливкой. Геометрия, видимость и
   * подписи у тем одни и те же; на печати страницы экранная тема
   * сама возвращается к строгой (стили .solid--ekran в stereo.css).
   */
  tema?: Tema;
  /**
   * Память сторон подписей живого чертежа (текст → направление): при
   * вращении подпись держится прежней стороны, пока ей там свободно.
   */
  pamyatPodpisey?: Map<string, number>;
  /**
   * Без подписей и точек вершин: миниатюры и пиктограммы, где буквы
   * мельче читаемого. Геометрия та же.
   */
  bezPodpisey?: boolean;
}

export type Tema = 'pechat' | 'ekran';

/* Экранная тема «стекло»: только цвета, прозрачность, толщины и
   кружки вершин. Цвета — токены (tokens.css, --solid-steklo-*). */
const STEKLO = {
  /* Экранная тема живёт только на страницах сайта, где токены заданы;
     запасные значения — те же токены хексом, на случай рисунка вне
     страницы (тогда он не станет чёрным). */
  colors: {
    edge: 'var(--solid-steklo-rebro, #3d79e0)',
    glass1: 'var(--solid-steklo-1, #f2f7fe)',
    glass2: 'var(--solid-steklo-2, #d7e5fa)',
    vydel: 'var(--solid-vydel, #e07a2f)',
  },
  width: { edge: 2.3, hidden: 1.6, vertex: 2 },
  dash: { hidden: '6 5' },
  opacity: { face: 0.8, sphere: 0.55, hidden: 0.6, section: 0.32, sectionHl: 0.4 },
  /* Кружок вершины: радиус в единицах рисунка. */
  vertex: 4.6,
} as const;

/** Короткий хеш строки: id градиента своего рисунка (на странице их много). */
function hashId(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function buildScene(model: Model, options: RenderOptions = {}): Scene {
  const scene: Scene = { strokes: [], fills: [], dots: [], labels: [], angles: [] };
  const view = options.view ?? modelView(model);
  const shag = options.shag;
  /* Виден ли элемент на этом шаге и выделен ли он. */
  const vidno = (item: { shag?: number }) =>
    shag === undefined || item.shag === undefined || item.shag <= shag;
  const hl = (item: { shag?: number }) => shag !== undefined && item.shag === shag;
  const all = occludersOf(view, model.bodies);
  const eps = modelExtent(model) * 1e-6;
  if (options.celi !== undefined && options.celi.length > 0) {
    scene.celi = options.celi.map((cel) => ({
      id: cel.id,
      points: cel.points.map(view.project),
      on: options.vybrano?.includes(cel.id) === true,
    }));
  }

  /* Есть стеклянное (внешнее) тело — остальные вписаны в него. */
  const estSteklo = model.bodies.some((b) => b.glass === true);
  model.bodies.forEach((body, owner) => {
    const s0 = scene.strokes.length;
    const f0 = scene.fills.length;
    switch (body.kind) {
      case 'polyhedron':
        addPolyhedron(view, scene, body, all, eps);
        break;
      case 'cylinder':
        addCylinder(view, scene, body, all, eps);
        break;
      case 'cone':
        addCone(view, scene, body, all, eps);
        break;
      case 'sphere':
        addSphere(view, scene, body, all, eps);
        break;
    }
    const ton: Ton = estSteklo && body.glass !== true ? 'inner' : 'outer';
    for (let i = s0; i < scene.strokes.length; i += 1) {
      scene.strokes[i] = { ...(scene.strokes[i] as Stroke), ton, owner };
    }
    for (let i = f0; i < scene.fills.length; i += 1) {
      scene.fills[i] = {
        ...(scene.fills[i] as Fill),
        ton,
        ...(body.glass === true ? { steklo: true } : {}),
      };
    }
  });

  /* Флаг выделения ставится только там, где он есть: у статичного
     чертежа разметка остаётся прежней до байта. */
  const sHl = <T extends object>(item: T, on: boolean): T => (on ? { ...item, hl: true } : item);

  (model.sections ?? []).filter(vidno).forEach((section) => {
    const on = hl(section);
    scene.fills.push(sHl({ points: section.points.map(view.project), role: 'section' }, on));
    /* Сечение тела вращения — многоугольник из десятков хорд: это кривая,
       а не отрезки, и в метрики отрезков вида она не идёт. */
    const krivaya = section.points.length > 12;
    if (krivaya) {
      /* Вершины кривой лежат на поверхности тела, а середины хорд —
         чуть внутри: проверка в середине хорды прятала бы и переднюю
         половину (большой круг шара — весь пунктиром). Поэтому видимость
         кривой — по её вершинам, смена — на середине хорды. */
      const pts = [...section.points, at(section.points, 0)];
      const vis = pts.map((p) => !hidden(view, p, all, eps));
      scene.strokes.push(
        ...curveStrokes(view, pts, vis, [], eps, 'section').map((st) => sHl(st, on)),
      );
      return;
    }
    section.points.forEach((a, i) => {
      const b = at(section.points, (i + 1) % section.points.length);
      scene.strokes.push(
        ...segmentStrokes(view, a, b, all, eps, 'section').map((st) => {
          const own = sHl(st, on);
          if (!krivaya) return own;
          const { seg: _, ...rest } = own;
          return rest;
        }),
      );
    });
  });

  (model.lines ?? []).filter(vidno).forEach((line) => {
    const on = hl(line);
    scene.strokes.push(
      ...segmentStrokes(view, line.a, line.b, all, eps, 'aux').map((st) => sHl(st, on)),
    );
    if (line.label) {
      scene.labels.push(
        sHl({ p: view.project(mid(line.a, line.b)), text: line.label, kind: 'aux' }, on),
      );
    }
  });

  (model.marks ?? []).filter(vidno).forEach((mark) => {
    const p = view.project(mark.p);
    scene.dots.push(p);
    if (mark.label) {
      scene.labels.push(
        sHl(
          {
            p,
            text: mark.label,
            kind: 'vertex',
            p3: mark.p,
            ...(hidden(view, mark.p, all, eps) ? { skryt: true } : {}),
          },
          hl(mark),
        ),
      );
    }
  });

  (model.measures ?? []).filter(vidno).forEach((measure) => {
    scene.labels.push(
      sHl(
        {
          p: view.project(mid(measure.a, measure.b)),
          text: measure.text,
          kind: 'measure',
        },
        hl(measure),
      ),
    );
  });

  (model.notes ?? []).filter(vidno).forEach((note) => {
    scene.labels.push(sHl({ p: view.project(note.p), text: note.text, kind: 'aux' }, hl(note)));
  });

  (model.angles ?? []).filter(vidno).forEach((angle) => {
    const o = view.project(angle.at);
    const u = view.project(add(angle.at, normalize(angle.u)));
    const v = view.project(add(angle.at, normalize(angle.v)));
    scene.angles.push(sHl({ points: [o, u, v] }, hl(angle)));
  });

  if (options.ustoychivo) {
    scene.labels = scene.labels.map((l) => ({ ...l, size: THEME.font.liveSize }));
  }
  return scene;
}

/* ── Один отрезок — одна линия ─────────────────────────────────────
   Шаблон может задать одну и ту же линию дважды: сторону сечения и
   отрезок построения (треугольник ABC₁ и отрезок AC₁). Невидимые копии,
   нарисованные навстречу друг другу, дают штрихи со сдвигом фазы, и
   пунктир на глаз сливается в сплошную. Поэтому:
   — каждый прямой кусок идёт в одну сторону (слева направо, сверху
     вниз), и штрихи совпадающих кусков совпадают;
   — кусок построения или сечения, лежащий на другом таком же куске с той
     же видимостью, не рисуется второй раз (остаётся выделенный шагом,
     затем сторона сечения). */

/** Порядок концов прямого куска: слева направо, при равных x — сверху вниз. */
function vPoryadke(st: Stroke): Stroke {
  const [p, q] = st.points as [Vec2, Vec2];
  const naoborot = p[0] > q[0] + 1e-9 || (Math.abs(p[0] - q[0]) <= 1e-9 && p[1] > q[1]);
  if (!naoborot) return st;
  return {
    ...st,
    points: [q, p],
    ...(st.p3 === undefined ? {} : { p3: [...st.p3].reverse() }),
  };
}

/** Кусок s лежит на куске t (в пространстве, с допуском tol). */
function lezhitNa(s: Stroke, t: Stroke, tol: number): boolean {
  if (s.p3?.length !== 2 || t.p3?.length !== 2) return false;
  const [a, b] = t.p3 as [Vec3, Vec3];
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 === 0) return false;
  return (s.p3 as Vec3[]).every((p) => {
    const u = dot(sub(p, a), ab) / l2;
    const blizh = add(a, [ab[0] * u, ab[1] * u, ab[2] * u]);
    const tolU = tol / Math.sqrt(l2);
    const d = sub(p, blizh);
    return u >= -tolU && u <= 1 + tolU && dot(d, d) <= tol * tol;
  });
}

const VES_KUSKA = (s: Stroke) => (s.hl ? 2 : 0) + (s.role === 'section' ? 1 : 0);

function bezPovtorov(strokes: Stroke[], tol: number): Stroke[] {
  const out = strokes.map((st) => (st.points.length === 2 ? vPoryadke(st) : st));
  const vydelenie = (st: Stroke) =>
    (st.role === 'aux' || st.role === 'section') && st.points.length === 2;
  const lishniy = new Set<number>();
  out.forEach((s, i) => {
    if (!vydelenie(s)) return;
    out.forEach((t, j) => {
      if (i === j || lishniy.has(j) || !vydelenie(t) || s.visible !== t.visible) return;
      if (!lezhitNa(s, t, tol)) return;
      /* s целиком на t: s лишний, если t не слабее или t длиннее s. */
      const ravny = lezhitNa(t, s, tol);
      if (!ravny || VES_KUSKA(t) > VES_KUSKA(s) || (VES_KUSKA(t) === VES_KUSKA(s) && j < i)) {
        lishniy.add(i);
      }
    });
  });
  return out.filter((_, i) => !lishniy.has(i));
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

/**
 * Описанная сфера модели: центр и радиус. От ракурса не зависит —
 * по ней живой чертёж держит масштаб и рамку при вращении.
 */
export function boundingSphere(model: Model): { center: Vec3; r: number } {
  const pts: Vec3[] = [];
  const round: { c: Vec3; r: number }[] = [];
  model.bodies.forEach((body) => {
    switch (body.kind) {
      case 'polyhedron':
        pts.push(...body.vertices);
        break;
      case 'cylinder':
      case 'cone': {
        const down = body.kind === 'cone' && body.inverted === true;
        const top: Vec3 = add(body.base, [0, 0, down ? -body.h : body.h]);
        round.push({ c: body.base, r: body.r });
        round.push({ c: top, r: body.kind === 'cone' ? (body.top ?? 0) : body.r });
        pts.push(body.base, top);
        break;
      }
      case 'sphere':
        round.push({ c: body.center, r: body.r });
        pts.push(body.center);
        break;
    }
  });
  (model.lines ?? []).forEach((l) => pts.push(l.a, l.b));
  (model.marks ?? []).forEach((m) => pts.push(m.p));
  round.forEach(({ c, r }) => {
    pts.push(add(c, [r, 0, 0]), add(c, [-r, 0, 0]), add(c, [0, r, 0]), add(c, [0, -r, 0]));
  });
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  pts.forEach((p) => {
    for (let i = 0; i < 3; i += 1) {
      lo[i] = Math.min(at(lo, i), at(p, i));
      hi[i] = Math.max(at(hi, i), at(p, i));
    }
  });
  const center: Vec3 = [
    (at(lo, 0) + at(hi, 0)) / 2,
    (at(lo, 1) + at(hi, 1)) / 2,
    (at(lo, 2) + at(hi, 2)) / 2,
  ];
  let r = 0;
  pts.forEach((p) => {
    r = Math.max(r, Math.sqrt(dot(sub(p, center), sub(p, center))));
  });
  round.forEach((b) => {
    r = Math.max(r, Math.sqrt(dot(sub(b.c, center), sub(b.c, center))) + b.r);
  });
  return { center, r: r || 1 };
}

/**
 * Всё, что нарисовано, в пикселях: сцена вписана в квадрат fit — по
 * рамке рисунка, а у живого чертежа по описанной сфере (рамка одна при
 * любом ракурсе).
 */
function toPixels(scene: Scene, sphere?: { center: Vec2; r: number }): Scene {
  const points = [
    ...scene.strokes.flatMap((s) => s.points),
    ...scene.fills.flatMap((f) => [...f.points, ...(f.dop ?? []).flat()]),
    ...scene.dots,
    ...scene.labels.map((l) => l.p),
  ];
  const box =
    sphere === undefined
      ? boxOf(points)
      : {
          minX: sphere.center[0] - sphere.r,
          minY: sphere.center[1] - sphere.r,
          maxX: sphere.center[0] + sphere.r,
          maxY: sphere.center[1] + sphere.r,
        };
  const w = box.maxX - box.minX || 1;
  const h = box.maxY - box.minY || 1;
  const k = THEME.geometry.fit / Math.max(w, h);
  const map = (p: Vec2): Vec2 => [(p[0] - box.minX) * k, (p[1] - box.minY) * k];
  return {
    strokes: scene.strokes.map((s) => ({ ...s, points: s.points.map(map) })),
    fills: scene.fills.map((f) => ({
      ...f,
      points: f.points.map(map),
      ...(f.dop === undefined ? {} : { dop: f.dop.map((k) => k.map(map)) }),
    })),
    dots: scene.dots.map(map),
    labels: scene.labels.map((l) => ({ ...l, p: map(l.p) })),
    ...(scene.celi === undefined
      ? {}
      : { celi: scene.celi.map((c) => ({ ...c, points: c.points.map(map) })) }),
    ...(scene.base === undefined ? {} : { base: scene.base.map(map) }),
    angles: scene.angles.map((a) => {
      const [o, u, v] = a.points.map(map) as [Vec2, Vec2, Vec2];
      const extra = a.hl ? { hl: true } : {};
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
        ...extra,
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
  const size = label.size ?? (label.kind === 'measure' ? f.measure : f.size);
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
  w += shirinaIndeksa(sub, size);
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
function placeLabels(scene: Scene, pamyat?: Map<string, number>): PlacedLabel[] {
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
  /* Рамки линий: место подписи, далёкое от рамки, линию заведомо не
     задевает, и точная проверка по отрезкам ему не нужна. Запас больше
     порога касания, поэтому выбор места от этого не меняется. */
  const PRUNE = 0.01;
  const strokeBoxes = scene.strokes.map((s) => boxOf(s.points));
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

    const bylo = pamyat?.get(label.text);
    let bestDir = 0;
    [gap, gap + 6, gap + 12, gap + 20, gap + 30].forEach((reachBase, ring) => {
      DIRECTIONS.forEach((dir, di) => {
        const reach = reachBase + Math.abs(dir[0]) * (w / 2) + Math.abs(dir[1]) * (h / 2);
        const cx = label.p[0] + dir[0] * reach;
        const cy = label.p[1] + dir[1] * reach;
        const x = cx - w / 2;
        const y = cy - h / 2;
        let score = ring * 5;
        /* Снаружи фигуры подпись читается лучше. */
        score += 6 * (1 - (dir[0] * outward[0] + dir[1] * outward[1]));
        /* Живой чертёж: подпись держится прежней стороны и не прыгает. */
        if (bylo !== undefined && bylo !== di) score += 4;

        const rx0 = x - clear - PRUNE;
        const ry0 = y - clear - PRUNE;
        const rx1 = x + w + clear + PRUNE;
        const ry1 = y + h + clear + PRUNE;
        strokes.forEach((segments, si) => {
          const sb = at(strokeBoxes, si);
          if (sb.maxX < rx0 || sb.minX > rx1 || sb.maxY < ry0 || sb.minY > ry1) {
            return;
          }
          const crosses = segments.some(
            ([a, b]) =>
              Math.max(a[0], b[0]) >= rx0 &&
              Math.min(a[0], b[0]) <= rx1 &&
              Math.max(a[1], b[1]) >= ry0 &&
              Math.min(a[1], b[1]) <= ry1 &&
              rectSegmentDistance(x - clear, y - clear, w + 2 * clear, h + 2 * clear, a, b) < 0.001,
          );
          /* Подпись на линии — почти запрещено: ищем дальше по кольцам. */
          if (crosses) {
            score += 120;
          }
        });
        scene.dots.forEach((dot2) => {
          if (
            pointRectDistance(dot2, x, y, w, h) < THEME.geometry.dot + 1 &&
            dist2(dot2, label.p) > 0.001
          ) {
            score += 80;
          }
        });
        placed.forEach((other) => {
          if (
            x < other.x + other.w + 2 &&
            x + w + 2 > other.x &&
            y < other.y + other.h + 2 &&
            y + h + 2 > other.y
          ) {
            score += 500;
          }
        });

        if (score < bestScore) {
          bestScore = score;
          bestDir = di;
          best = { ...label, x, y, w, h };
        }
      });
    });
    if (best) {
      placed.push(best);
      pamyat?.set(label.text, bestDir);
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

function strokeAttrs(s: Stroke, ekran = false): string {
  const c = THEME.colors;
  const w = THEME.width;
  if (ekran && !s.hl && s.role === 'edge') {
    return s.visible
      ? `class="solid-rebro" stroke="${STEKLO.colors.edge}" stroke-width="${STEKLO.width.edge}"`
      : `class="solid-rebro" stroke="${STEKLO.colors.edge}" stroke-width="${STEKLO.width.hidden}" stroke-opacity="${STEKLO.opacity.hidden}" stroke-dasharray="${STEKLO.dash.hidden}"`;
  }
  if (s.hl) {
    return s.visible
      ? `stroke="${c.aux}" stroke-width="${w.hl}"`
      : `stroke="${c.aux}" stroke-width="${w.hlHidden}" stroke-dasharray="${THEME.dash.aux}"`;
  }
  if (s.role === 'edge') {
    const cvet = s.ton === 'inner' ? c.inner : c.edge;
    return s.visible
      ? `stroke="${cvet}" stroke-width="${w.edge}"`
      : `stroke="${cvet}" stroke-width="${w.hidden}" stroke-opacity="${THEME.opacity.hidden}" stroke-dasharray="${THEME.dash.hidden}"`;
  }
  return s.visible
    ? `stroke="${c.aux}" stroke-width="${w.aux}"`
    : `stroke="${c.aux}" stroke-width="${w.auxHidden}" stroke-dasharray="${THEME.dash.aux}"`;
}

function fillAttrs(f: Fill, gradient?: string): string {
  const c = THEME.colors;
  const o = THEME.opacity;
  /* Стеклянное внешнее тело не заливается: сквозь него видно вписанное. */
  if (f.steklo && (f.role === 'face' || f.role === 'sphere')) return 'fill="none"';
  if (gradient !== undefined) {
    const k = STEKLO.opacity;
    switch (f.role) {
      case 'face':
        return `class="solid-gran" fill="url(#${gradient})" fill-opacity="${k.face}"`;
      case 'sphere':
        return `class="solid-gran" fill="url(#${gradient})" fill-opacity="${k.sphere}"`;
      case 'liquid':
        return `fill="${c.liquid}" fill-opacity="${o.liquid}"`;
      case 'section':
        return `class="solid-vydel" fill="${STEKLO.colors.vydel}" fill-opacity="${f.hl ? k.sectionHl : k.section}"`;
    }
  }
  switch (f.role) {
    case 'face':
      return `fill="${c.face}" fill-opacity="${o.face}"`;
    case 'sphere':
      return `fill="${c.face}" fill-opacity="${o.sphere}"`;
    case 'liquid':
      return `fill="${c.liquid}" fill-opacity="${o.liquid}"`;
    case 'section':
      return `fill="${c.aux}" fill-opacity="${f.hl ? o.sectionHl : o.section}"`;
  }
}

function labelMarkup(label: PlacedLabel): string {
  const f = THEME.font;
  const { base, sub } = splitName(label.text);
  const size = label.size ?? (label.kind === 'measure' ? f.measure : f.size);
  const fill = label.kind === 'aux' || label.hl ? THEME.colors.aux : THEME.colors.label;
  /* Шрифты подписей — общие для рисунков сайта (lib/risunki/shrifty):
     буквы-вершины — KaTeX_Math курсивом, числа — KaTeX_Main прямым. */
  const bukva = label.kind === 'vertex' || label.kind === 'aux';
  const family = bukva ? BUKVY : CHISLA;
  const weight = VES;
  const style = bukva ? ' font-style="italic"' : '';
  const x = label.x;
  const y = label.y + label.h * 0.78;
  const inner = sub ? `${esc(base)}${indeksSvg(esc(sub), size)}` : esc(base);
  /* Подпись закрытой вершины — бледнее, но читается. */
  const blednee = label.skryt === true ? ' opacity="0.55" data-skryt="1"' : '';
  return (
    /* Выделенная шагом подпись — цветом построений; class="solid-hl" и
       data-hl — метки для проверок (жирного начертания нет). */
    `<text${label.hl ? ' class="solid-hl"' : ''} x="${px(x)}" y="${px(y)}" font-family="${family}" font-size="${size}" font-weight="${weight}"${style} ` +
    `fill="${fill}"${label.hl ? ' data-hl="1"' : ''}${blednee} paint-order="stroke" stroke="${THEME.colors.surface}" stroke-width="${THEME.width.halo}" stroke-linejoin="round">${inner}</text>`
  );
}

/** Модель → SVG. */
export function renderSolid(model: Model, options: RenderOptions = {}): string {
  const scene = pixelScene(model, options);
  if (options.bezPodpisey) {
    scene.labels = [];
    scene.dots = [];
  }
  const labels = placeLabels(scene, options.pamyatPodpisey);

  const pad = THEME.geometry.pad;
  const box = boxOf([
    ...scene.strokes.flatMap((s) => s.points),
    ...scene.fills.flatMap((f) => [...f.points, ...(f.dop ?? []).flat()]),
    ...scene.angles.flatMap((a) => a.points),
    ...scene.dots.map((p): Vec2 => [p[0] - THEME.geometry.dot, p[1] - THEME.geometry.dot]),
    ...scene.dots.map((p): Vec2 => [p[0] + THEME.geometry.dot, p[1] + THEME.geometry.dot]),
    ...labels.map((l): Vec2 => [l.x - 2, l.y - 2]),
    ...labels.map((l): Vec2 => [l.x + l.w + 2, l.y + l.h + 2]),
  ]);
  /* Живой чертёж — постоянная рамка: квадрат fit с полем под подписи. */
  const m = THEME.geometry.liveMargin;
  const fit = THEME.geometry.fit;
  const x0 = options.ustoychivo ? -m : box.minX - pad;
  const y0 = options.ustoychivo ? -m : box.minY - pad;
  const width = options.ustoychivo ? fit + 2 * m : box.maxX - box.minX + 2 * pad;
  const height = options.ustoychivo ? fit + 2 * m : box.maxY - box.minY + 2 * pad;

  const order = (list: Stroke[], role: Role, visible: boolean) =>
    list.filter((s) => s.role === role && s.visible === visible);

  const ekran = options.tema === 'ekran';
  /* Id градиента — по самому рисунку: одинаковые рисунки делят
     одинаковое определение, разные не путаются. */
  const gradient = ekran ? `sg${hashId(pathOf(scene.strokes.flatMap((s) => s.points)) + model.alt)}` : undefined;
  const parts: string[] = [];
  if (gradient !== undefined) {
    parts.push(
      `<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0.35" y2="1">` +
        `<stop offset="0" style="stop-color:${STEKLO.colors.glass1}"/>` +
        `<stop offset="1" style="stop-color:${STEKLO.colors.glass2}"/>` +
        `</linearGradient></defs>`,
    );
  }
  scene.fills
    .filter((f) => f.role === 'face' || f.role === 'sphere')
    .forEach((f) => {
      const d = [f.points, ...(f.dop ?? [])].map((k) => pathOf(k, true)).join('');
      parts.push(`<path d="${d}" ${fillAttrs(f, gradient)} stroke="none"/>`);
    });
  scene.fills
    .filter((f) => f.role === 'liquid' || f.role === 'section')
    .forEach((f) =>
      parts.push(`<path d="${pathOf(f.points, true)}" ${fillAttrs(f, gradient)} stroke="none"/>`),
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
        `<path d="${pathOf(s.points)}" fill="none" ${strokeAttrs(s, ekran)} stroke-linecap="round" stroke-linejoin="round"/>`,
      );
    });
  });

  scene.angles.forEach((a) => {
    const [o, u, v] = a.points;
    const corner: Vec2 = [u[0] + v[0] - o[0], u[1] + v[1] - o[1]];
    parts.push(
      `<path d="${pathOf([u, corner, v])}" fill="none" stroke="${THEME.colors.aux}" stroke-width="${a.hl ? THEME.width.hlMarker : THEME.width.marker}" stroke-linejoin="round"/>`,
    );
  });

  scene.dots.forEach((p) => {
    parts.push(
      ekran
        ? `<circle class="solid-vershina" cx="${px(p[0])}" cy="${px(p[1])}" r="${STEKLO.vertex}" fill="${THEME.colors.surface}" stroke="${STEKLO.colors.edge}" stroke-width="${STEKLO.width.vertex}"/>`
        : `<circle cx="${px(p[0])}" cy="${px(p[1])}" r="${THEME.geometry.dot}" fill="${THEME.colors.edge}" stroke="${THEME.colors.surface}" stroke-width="${THEME.width.dotStroke}"/>`,
    );
  });

  labels.forEach((label) => parts.push(labelMarkup(label)));

  /* Цели касания — поверх всего: подсветка выбранной и широкая
     прозрачная полоса, по которой попадает палец. */
  (scene.celi ?? []).forEach((cel) => {
    const closed = cel.points.length > 2;
    const d = pathOf(cel.points, closed);
    if (cel.on) {
      const c = ekran ? STEKLO.colors.vydel : THEME.colors.aux;
      parts.push(
        `<path class="solid-cel-on" d="${d}" fill="${closed ? c : 'none'}" fill-opacity="${ekran ? 0.32 : 0.22}" ` +
          `stroke="${c}" stroke-opacity="${ekran ? 0.85 : 0.55}" stroke-width="${ekran ? 5 : 7}" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`,
      );
    }
    parts.push(
      `<path class="solid-cel" data-cel="${esc(cel.id)}" d="${d}" fill="${closed ? 'transparent' : 'none'}" ` +
        `stroke="transparent" stroke-width="${px(options.celShirina ?? 22)}" stroke-linecap="round" stroke-linejoin="round" pointer-events="${closed ? 'all' : 'stroke'}"/>`,
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" data-engine="solid" viewBox="${px(x0)} ${px(y0)} ${px(width)} ${px(height)}" ` +
    `width="${px(width)}" height="${px(height)}" data-line-pt="1.35" data-line-w="${THEME.width.edge}" role="img" aria-label="${esc(model.alt)}" class="${ekran ? 'solid solid--ekran' : 'solid'}">` +
    `<title>${esc(model.alt)}</title>${parts.join('')}</svg>`
  );
}

/**
 * Диагностика чертежа: та же сцена в пикселях, что уходит в SVG,
 * плюс расставленные подписи. Нужна проверяльщику чертежей, чтобы
 * измерять зазоры и не пересчитывать геометрию заново.
 */
export interface SolidDiagnostics {
  strokes: { points: Vec2[]; role: Role; visible: boolean }[];
  labels: { x: number; y: number; w: number; h: number; text: string; kind: string }[];
  dots: Vec2[];
  angles: number;
  fills: number;
  width: number;
  height: number;
}

/** Сцена в пикселях: рамка рисунка или, у живого чертежа, описанная сфера. */
/**
 * Сцена для рисования — без повторов линий (bezPovtorov). Метрики вида
 * (solidKarkas) берут сцену как есть: выбор ракурса от этого не зависит.
 */
function odnaLiniya(model: Model, scene: Scene): Scene {
  return { ...scene, strokes: bezPovtorov(scene.strokes, modelExtent(model) * 1e-4) };
}

function pixelScene(model: Model, options: RenderOptions, risovat = true): Scene {
  const sobrana = buildScene(model, options);
  const scene = risovat ? odnaLiniya(model, sobrana) : sobrana;
  if (!options.ustoychivo) {
    return toPixels(scene);
  }
  const view = options.view ?? modelView(model);
  const sphere = boundingSphere(model);
  return toPixels(scene, { center: view.project(sphere.center), r: sphere.r });
}

/**
 * Каркас чертежа для метрик вида: прямые отрезки (куски одного отрезка
 * собраны обратно), точки с именами, основание и рамка — в пикселях
 * статичного чертежа, плюс те же отрезки и точки в пространстве.
 */
export interface SolidKarkas {
  otrezki: { a: Vec2; b: Vec2; a3: Vec3; b3: Vec3 }[];
  tochki: { imya: string; p: Vec2; p3: Vec3 }[];
  osnovanie: Vec2[] | null;
  /** Рамка всех линий чертежа, пиксели. */
  ramka: { w: number; h: number };
}

export function solidKarkas(model: Model, options: RenderOptions = {}): SolidKarkas {
  const scene = pixelScene(model, options, false);
  const bySeg = new Map<object, { pts: Vec2[]; a3: Vec3; b3: Vec3 }>();
  for (const s of scene.strokes) {
    if (s.seg === undefined) continue;
    const e = bySeg.get(s.seg) ?? { pts: [], a3: s.seg.a, b3: s.seg.b };
    e.pts.push(...s.points);
    bySeg.set(s.seg, e);
  }
  const otrezki = [...bySeg.values()].map((e) => {
    /* Концы — крайние точки кусков вдоль отрезка. */
    const o = at(e.pts, 0);
    const far = e.pts.reduce((m, p) => (dist2(p, o) > dist2(m, o) ? p : m), o);
    const near = e.pts.reduce((m, p) => (dist2(p, far) > dist2(m, far) ? p : m), far);
    return { a: near, b: far, a3: e.a3, b3: e.b3 };
  });
  const tochki = scene.labels
    .filter((l) => l.kind === 'vertex' && l.p3 !== undefined)
    .map((l) => ({ imya: l.text, p: l.p, p3: l.p3 as Vec3 }));
  const box = boxOf(scene.strokes.flatMap((st) => st.points));
  return {
    otrezki,
    tochki,
    osnovanie: scene.base ?? null,
    ramka: { w: box.maxX - box.minX, h: box.maxY - box.minY },
  };
}

/**
 * Линии чертежа в пространстве с видимостью, как их нарисовал движок:
 * для независимой проверки видимости (scripts/check-stereo-kachestvo.mjs).
 * owner — номер тела в model.bodies; нет — пометка (отрезок, сечение).
 */
export function solidLinii(
  model: Model,
  options: RenderOptions = {},
): { p3: Vec3[]; visible: boolean; role: Role; owner?: number; liquid?: boolean }[] {
  return odnaLiniya(model, buildScene(model, options)).strokes.flatMap((s) =>
    s.p3 === undefined
      ? []
      : [
          {
            p3: s.p3,
            visible: s.visible,
            role: s.role,
            ...(s.owner === undefined ? {} : { owner: s.owner }),
            ...(s.liquid ? { liquid: true } : {}),
          },
        ],
  );
}

export function solidDiagnostics(model: Model, options: RenderOptions = {}): SolidDiagnostics {
  const scene = pixelScene(model, options);
  const labels = placeLabels(scene);
  const box = boxOf([...scene.strokes.flatMap((s) => s.points), ...scene.dots]);
  return {
    strokes: scene.strokes.map((s) => ({ points: s.points, role: s.role, visible: s.visible })),
    labels: labels.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h, text: l.text, kind: l.kind })),
    dots: scene.dots,
    angles: scene.angles.length,
    fills: scene.fills.length,
    width: box.maxX - box.minX,
    height: box.maxY - box.minY,
  };
}

export { THEME as SOLID_THEME };
