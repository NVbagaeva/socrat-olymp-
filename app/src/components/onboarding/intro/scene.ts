/**
 * Сцена заставки: стеклянный октаэдр раскрывается по развёртке от
 * нижней вершины, из него распускается лотос. Чистый WebGL2 — почему
 * не three.js, сказано в README раздела онбординга.
 *
 * Сцена ничего не знает о React и о времени: render(t) рисует кадр
 * момента t (секунды от начала). Поэтому «Пропустить» — просто
 * render(T_CARD), а статичный кадр — тот же кадр в момент IDLE_STOP_S.
 *
 * Развёртка честная. Грань октаэдра у нижней вершины B и примыкающая к
 * ней по экваториальному ребру верхняя грань образуют «лепесток-ромб».
 * Все повороты — вокруг осей, перпендикулярных радиальной плоскости
 * своего ромба: нижняя грань — вокруг горизонтали через B, верхняя —
 * вокруг общего ребра. Касательная координата точек при этом не
 * меняется, а радиальная только растёт, так что каждый ромб остаётся в
 * своём секторе ±45° и с соседями не пересекается.
 */

import {
  OCTA_EDGE,
  OCTA_FACE_H,
  edgeGeometry,
  filamentGeometry,
  particleGeometry,
  petalGeometry,
  plateGeometry,
  quadGeometry,
  stamenGeometry,
  type PetalShape,
} from './geometry';
import { GL, type Mesh, type Program, type Target } from './gl';
import { FLOWER_W, type Anchor } from './layout';
import { LOWER_TRI, UPPER_TRI, petalFrames, unfoldAngles } from './unfold';
import {
  lookAt,
  multiply,
  perspective,
  project,
  rotationX,
  rotationY,
  scale,
  transformPoint,
  translation,
  uniformScale,
  type Mat4,
  type Vec3,
} from './math';
import {
  COMPOSITE_FS,
  DOWN_FS,
  EDGE_FS,
  FULL_VS,
  GLASS_FS,
  GOLD_FS,
  LINE_FS,
  LINE_VS,
  MESH_VS,
  POINTS_FS,
  POINTS_VS,
  PREFILTER_FS,
  SPRITE_FS,
  SPRITE_VS,
  UP_FS,
} from './shaders';
import {
  IDLE_STOP_S,
  T_CARD,
  T_FLOWER,
  easeInOutCubic,
  easeOutCubic,
  smooth,
  span,
  spring,
} from './timeline';

/** high — компьютер: преломление, MSAA, полное свечение; low — телефон. */
export type Tier = 'high' | 'low';

export interface SceneLayout {
  /** Размер холста, CSS px. */
  w: number;
  h: number;
  /** Поза над окном (момент T_CARD и дальше). */
  final: Anchor;
  /** Телефонная раскладка: в начале крупнее, по ширине экрана. */
  phone: boolean;
}

export interface IntroScene {
  render(t: number): void;
  setLayout(layout: SceneLayout): void;
  /** Сколько объектов WebGL живо — для проверки утечек. */
  liveObjects(): number;
  dispose(): void;
}

const DEG = Math.PI / 180;

/* ── Цветок ───────────────────────────────────────────────────── */

interface PetalSpec {
  /** Азимут в финальной позе, градусы; 0 — к зрителю, + — вправо. */
  az: number;
  /** Наклон наружу от вертикали, градусы. */
  tilt: number;
  /** Начало раскрытия, с. */
  start: number;
  base: Vec3;
  shape: PetalShape;
}

const shape = (
  length: number,
  width: number,
  bend: number,
  cup: number,
  tip = 0.6,
): PetalShape => ({
  length,
  width,
  thickness: 0.2,
  bend,
  cup,
  tip,
});

/** Лепестки одного яруса: [азимут, наклон, длина, ширина, изгиб, кончик]. */
function tier(
  start: number,
  y: number,
  rows: readonly (readonly [number, number, number, number, number, number])[],
): PetalSpec[] {
  return rows.flatMap(([az, tilt, length, width, bend, tip], i) =>
    (az === 0 || az === 180 ? [az] : [-az, az]).map((a, j) => ({
      az: a,
      tilt,
      start: start + i * 0.07 + j * 0.03,
      base: [0, y, 0] as Vec3,
      shape: shape(length, width, bend, 0.24, tip),
    })),
  );
}

/**
 * Два яруса гладких лепестков (слои 3 и 4 в docs/mockups/intro/).
 * Внешний: высокий задний, две пары по бокам — выше и почти лёжа, и
 * пара передних, лежащих чашечкой. Внутренний — бутон: высокий
 * центральный, боковые и две пары передних пониже. Ярусы и лепестки
 * в них раскрываются по очереди.
 */
const PETALS: readonly PetalSpec[] = [
  ...tier(2.0, 0.98, [
    [180, 12, 1.62, 0.95, 0.1, 0.6],
    [150, 36, 1.52, 0.9, 0.18, 0.6],
    [112, 66, 1.48, 0.84, 0.22, 0.62],
    [42, 76, 1.25, 0.84, 0.3, 0.4],
  ]),
  ...tier(2.4, 1.04, [
    [180, 4, 1.5, 0.86, 0.04, 0.6],
    [140, 16, 1.32, 0.76, 0.1, 0.58],
    [100, 32, 1.12, 0.72, 0.2, 0.5],
    /* Передние лежат низко: тычинки видны над ними (слой 1). */
    [30, 80, 0.85, 0.7, 0.25, 0.38],
  ]),
];

const PLATE_YAW = 45 * DEG;
const CORE: Vec3 = [0, 1.4, 0];
const STAMEN_ROOT: Vec3 = [0, 1.22, 0];
const OCTA_CENTER: Vec3 = [0, 1, 0];
const UP: Vec3 = [0, 1, 0];

/* Камера: смотрит на центр цветка чуть сверху; масштаб меняется углом
   обзора, положение — сдвигом объектива. Так кадр в любой момент — та
   же картинка с другим масштабом и сдвигом, и статичный кадр совпадает
   с живым. */
const CAM_TARGET: Vec3 = [0, 1.25, 0];
const CAM_DIST = 12;
/** Камера поднимается, пока распускается цветок: сверху видна сердцевина. */
function camEye(t: number): Vec3 {
  const e = (8 + 16 * easeInOutCubic(span(t, 1.4, 3.3))) * DEG;
  return [0, CAM_TARGET[1] + CAM_DIST * Math.sin(e), CAM_DIST * Math.cos(e)];
}

interface Detail {
  maxPixels: number;
  samples: number;
  bloomLevels: number;
  bloomScale: number;
  particles: number;
  petalU: number;
  petalV: number;
  refract: boolean;
  bloom: number;
}

const DETAIL: Record<Tier, Detail> = {
  high: {
    maxPixels: 2.6e6,
    samples: 4,
    bloomLevels: 5,
    bloomScale: 2,
    particles: 80,
    petalU: 40,
    petalV: 32,
    refract: true,
    bloom: 0.75,
  },
  low: {
    maxPixels: 1.6e6,
    samples: 0,
    bloomLevels: 4,
    bloomScale: 4,
    particles: 32,
    petalU: 26,
    petalV: 20,
    refract: false,
    bloom: 0.75,
  },
};

/** still — кадр для картинки-заглушки (свечение пишется в альфу). */
export function createIntroScene(
  canvas: HTMLCanvasElement,
  tier: Tier,
  opts: { still?: boolean } = {},
): IntroScene | null {
  const ctx = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: tier === 'high' ? 'high-performance' : 'default',
  });
  if (ctx === null) return null;
  return new Scene(canvas, ctx, DETAIL[tier], opts.still === true);
}

interface PetalRuntime {
  spec: PetalSpec;
  mesh: Mesh;
  tip: Vec3;
}

class Scene implements IntroScene {
  private readonly g: GL;
  private readonly canvas: HTMLCanvasElement;
  private readonly d: Detail;
  private layout: SceneLayout | null = null;
  private pxW = 0;
  private pxH = 0;

  private readonly glass: Program;
  private readonly plateGlass: Program;
  private readonly edge: Program;
  private readonly gold: Program;
  private readonly line: Program;
  private readonly particles: Program;
  private readonly sparks: Program;
  private readonly sprite: Program;
  private readonly prefilter: Program;
  private readonly down: Program;
  private readonly up: Program;
  private readonly composite: Program;

  private readonly lowerPlate: Mesh;
  private readonly upperPlate: Mesh;
  private readonly lowerEdges: Mesh;
  private readonly upperEdges: Mesh;
  private readonly petals: PetalRuntime[];
  private readonly stamens: Mesh;
  private readonly filaments: Mesh;
  private readonly particleMesh: Mesh;
  private readonly sparkMesh: Mesh;
  private readonly sparkData: Float32Array;
  private readonly sparkExtra: Float32Array;
  private readonly quad: Mesh;

  private scene: Target | null = null;
  private back: Target | null = null;
  private bloomDown: Target[] = [];
  private bloomUp: Target[] = [];

  private readonly still: boolean;

  constructor(canvas: HTMLCanvasElement, ctx: WebGL2RenderingContext, d: Detail, still: boolean) {
    this.canvas = canvas;
    this.still = still;
    this.d = d;
    const g = new GL(ctx);
    this.g = g;
    const gl = ctx;
    const refract = d.refract ? ['REFRACT'] : [];

    this.glass = g.program(MESH_VS, GLASS_FS, refract);
    this.plateGlass = g.program(MESH_VS, GLASS_FS, ['PLATE', ...refract]);
    this.edge = g.program(MESH_VS, EDGE_FS);
    this.gold = g.program(MESH_VS, GOLD_FS, ['GROW']);
    this.line = g.program(LINE_VS, LINE_FS);
    this.particles = g.program(POINTS_VS, POINTS_FS, ['PARTICLES']);
    this.sparks = g.program(POINTS_VS, POINTS_FS);
    this.sprite = g.program(SPRITE_VS, SPRITE_FS);
    this.prefilter = g.program(FULL_VS, PREFILTER_FS);
    this.down = g.program(FULL_VS, DOWN_FS);
    this.up = g.program(FULL_VS, UP_FS);
    this.composite = g.program(FULL_VS, COMPOSITE_FS);

    const lowerTri = LOWER_TRI;
    const upperTri = UPPER_TRI;
    this.lowerPlate = g.mesh(plateGeometry(lowerTri, 0.045, 0.07), gl.TRIANGLES);
    this.upperPlate = g.mesh(plateGeometry(upperTri, 0.045, 0.07), gl.TRIANGLES);
    this.lowerEdges = g.mesh(edgeGeometry(lowerTri, 0.017), gl.TRIANGLES);
    /* Ребро сгиба у верхней грани общее с нижней — его рисует нижняя. */
    this.upperEdges = g.mesh(edgeGeometry(upperTri, 0.017, [0]), gl.TRIANGLES);

    this.petals = PETALS.map((spec) => {
      const geo = petalGeometry(spec.shape, d.petalU, d.petalV);
      const last = (geo.position.length / 3 - 1) * 3;
      return {
        spec,
        mesh: g.mesh(geo, gl.TRIANGLES),
        tip: [geo.position[last]!, geo.position[last + 1]!, geo.position[last + 2]!],
      };
    });
    this.stamens = g.mesh(
      stamenGeometry(STAMEN_ROOT, 58, 7, { seg: 6, ball: d.refract ? 8 : 5 }),
      gl.TRIANGLES,
    );
    this.filaments = g.mesh(filamentGeometry(d.refract ? 22 : 14, 11), gl.LINES);
    this.particleMesh = g.mesh(particleGeometry(d.particles, 23), gl.POINTS);

    /* Искры: 4 ромба × (нижний угол + 2 угла сгиба + вершина) + кончики лепестков. */
    const sparkCount = 1 + 4 * 3 + this.petals.length;
    this.sparkData = new Float32Array(sparkCount * 3);
    this.sparkExtra = new Float32Array(sparkCount * 4);
    for (let i = 0; i < sparkCount; i += 1) this.sparkExtra[i * 4 + 1] = (i * 0.618) % 1;
    this.sparkMesh = g.mesh(
      {
        position: this.sparkData,
        normal: new Float32Array(sparkCount * 3),
        extra: this.sparkExtra,
        count: sparkCount,
      },
      gl.POINTS,
      true,
    );
    this.quad = g.mesh(quadGeometry(), gl.TRIANGLES);
  }

  liveObjects(): number {
    return this.g.live();
  }

  setLayout(layout: SceneLayout): void {
    this.layout = layout;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = Math.min(dpr, Math.sqrt(this.d.maxPixels / Math.max(1, layout.w * layout.h)));
    const w = Math.max(1, Math.round(layout.w * k));
    const h = Math.max(1, Math.round(layout.h * k));
    if (w === this.pxW && h === this.pxH) return;
    this.pxW = w;
    this.pxH = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.makeTargets();
  }

  private makeTargets(): void {
    const g = this.g;
    for (const t of [this.scene, this.back, ...this.bloomDown, ...this.bloomUp]) {
      if (t !== null) g.dropTarget(t);
    }
    const { pxW: w, pxH: h, d } = this;
    this.scene = g.target(w, h, { float: true, depth: true, samples: d.samples });
    this.back = d.refract
      ? g.target(Math.ceil(w / 2), Math.ceil(h / 2), { float: true, depth: true, samples: 0 })
      : null;
    this.bloomDown = [];
    this.bloomUp = [];
    let bw = Math.ceil(w / d.bloomScale);
    let bh = Math.ceil(h / d.bloomScale);
    for (let i = 0; i < d.bloomLevels; i += 1) {
      this.bloomDown.push(g.target(bw, bh, { float: true, depth: false, samples: 0 }));
      if (i < d.bloomLevels - 1) {
        this.bloomUp.push(g.target(bw, bh, { float: true, depth: false, samples: 0 }));
      }
      bw = Math.max(1, Math.ceil(bw / 2));
      bh = Math.max(1, Math.ceil(bh / 2));
    }
  }

  /* ── Кадр ─────────────────────────────────────────────────── */

  render(tIn: number): void {
    const layout = this.layout;
    if (layout === null || this.scene === null) return;
    const g = this.g;
    const gl = g.gl;
    if (gl.isContextLost()) return;
    const t = Math.min(tIn, IDLE_STOP_S);

    /* Камера. */
    const eye = camEye(t);
    const cam = camera(t, layout, eye);
    const view = lookAt(eye, CAM_TARGET, UP);
    const viewProj = multiply(cam.proj, view);
    const right: Vec3 = [view[0]!, view[4]!, view[8]!];
    const upv: Vec3 = [view[1]!, view[5]!, view[9]!];
    const pxScale = (Math.min(window.devicePixelRatio || 1, 2) * cam.unitPx) / 250;

    /* Поворот и «дыхание» всего цветка. */
    const idle =
      smooth(span(t, T_CARD, T_CARD + 1.2)) * (1 - smooth(span(t, IDLE_STOP_S - 2, IDLE_STOP_S)));
    const yaw =
      -16 * DEG * (1 - easeInOutCubic(span(t, 0, 2.4))) +
      0.14 * Math.sin(((t - T_CARD) / 16) * Math.PI * 2) * idle;
    const breath = 1 + 0.014 * Math.sin(((t - T_CARD) / 4.5) * Math.PI * 2) * idle;
    const group = multiply(rotationY(yaw), uniformScale(breath));

    /* Проявление октаэдра. */
    const reveal = smooth(span(t, 0.05, 0.7));
    const octaK = 0.9 + 0.1 * easeOutCubic(span(t, 0, 0.8));
    /* Ромбы — по диагоналям (±45°, ±135°): спереди зигзаг нижних граней,
       по бокам — шипы верхних (слой 2). В собранном виде к зрителю
       смотрит вершина экватора, как на кадре 1. */
    const octaM = multiply(
      multiply(group, rotationY(PLATE_YAW)),
      multiply(
        translation(OCTA_CENTER),
        multiply(uniformScale(octaK), translation(scale(OCTA_CENTER, -1))),
      ),
    );
    const unfold = span(t, 0.8, 2.0);
    const { aL, aU } = unfoldAngles(t);
    const frames = petalFrames(aL, aU);

    const coreI =
      smooth(span(t, 0.9, 1.9)) *
      (0.9 + 0.25 * Math.exp(-((t - 1.7) ** 2) * 6)) *
      (1 + 0.04 * Math.sin(t * 3.1));
    const core = transformPoint(group, CORE);
    const cameraWorld = eye;

    /* Пластины граней. */
    const plates: { m: Mat4; mesh: Mesh; edges: Mesh; center: Vec3 }[] = [];
    let sp = 0;
    const spark = (p: Vec3, i: number) => {
      this.sparkData.set(p, sp * 3);
      this.sparkExtra[sp * 4] = i;
      sp += 1;
    };
    spark(transformPoint(octaM, [0, 0, 0]), 0.9);
    for (const f of frames) {
      const mL = multiply(octaM, f.lower);
      const mU = multiply(octaM, f.upper);
      const a = OCTA_EDGE / 2;
      plates.push({
        m: mL,
        mesh: this.lowerPlate,
        edges: this.lowerEdges,
        center: transformPoint(mL, [0, (OCTA_FACE_H * 2) / 3, 0]),
      });
      plates.push({
        m: mU,
        mesh: this.upperPlate,
        edges: this.upperEdges,
        center: transformPoint(mU, [0, OCTA_FACE_H / 3, 0]),
      });
      /* В собранном октаэдре углы соседних ромбов совпадают: второй угол
         и общая верхняя вершина разгораются по мере раскрытия. */
      spark(transformPoint(mL, [a, OCTA_FACE_H, 0]), 0.75);
      spark(transformPoint(mL, [-a, OCTA_FACE_H, 0]), 0.75 * smooth(unfold));
      spark(transformPoint(mU, [0, OCTA_FACE_H, 0]), 0.25 + 0.75 * smooth(unfold));
    }

    /* Лепестки. */
    const petals: { m: Mat4; mesh: Mesh; center: Vec3; alpha: number }[] = [];
    for (const p of this.petals) {
      const s = p.spec;
      const open = spring(span(t, s.start, s.start + 0.9));
      const grow = easeOutCubic(span(t, s.start, s.start + 0.65));
      const alpha = smooth(span(t, s.start, s.start + 0.3));
      const tilt = (4 + (s.tilt - 4) * open) * DEG;
      const m = multiply(
        group,
        multiply(
          translation(s.base),
          multiply(
            rotationY(s.az * DEG),
            multiply(rotationX(tilt), uniformScale(0.08 + 0.92 * grow)),
          ),
        ),
      );
      const tip = transformPoint(m, p.tip);
      spark(tip, alpha * 0.45);
      if (alpha > 0) {
        petals.push({ m, mesh: p.mesh, center: transformPoint(m, scale(p.tip, 0.5)), alpha });
      }
    }
    g.updatePositions(this.sparkMesh, this.sparkData);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.uploadSparkExtra();

    const halo = Math.exp(-((t - 0.2) ** 2) * 14) * (1 - span(t, 0.5, 1.0));
    const flare = smooth(span(t, 0.2, 0.8)) * (0.85 + 0.25 * coreI);

    const common = { uViewProj: viewProj, uCam: cameraWorld, uTime: t };

    /* Слой свечения: ядро, нити, тычинки, отблеск на полу. Рисуется в
       сцену и (на компьютере) ещё раз в отдельную текстуру — её видно
       сквозь стекло с преломлением. */
    const stamenT = t - 2.45;
    const drawStamens = () => {
      g.use(this.gold, { ...common, uModel: group, uCore: core, uGrow: stamenT, uI: 1 });
      g.draw(this.stamens);
    };
    const drawGlowLayer = (toBack: boolean) => {
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      if (stamenT > 0 && toBack) drawStamens();
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      /* Нити разгораются при раскрытии и остаются «сеточкой» вокруг ядра. */
      const filI = smooth(span(t, 1.0, 1.6)) * (1 - 0.35 * smooth(span(t, 2.6, 3.4)));
      if (filI > 0) {
        g.use(this.line, { ...common, uModel: group, uCore: CORE, uI: filI });
        g.draw(this.filaments);
      }
      this.drawSprite(viewProj, right, upv, core, [0.75, 0.75], 0, coreI);
      const base = transformPoint(group, [0, 0, 0]);
      this.drawSprite(viewProj, [1, 0, 0], [0, 0, 1], base, [2.1, 0.9], 2, flare * 0.6);
      this.drawSprite(viewProj, right, upv, base, [1.9, 0.75], 1, flare * 0.7);
      if (halo > 0.001) {
        this.drawSprite(
          viewProj,
          right,
          upv,
          transformPoint(group, OCTA_CENTER),
          [2.2, 2.2],
          3,
          halo,
        );
      }
      gl.depthMask(true);
    };

    if (this.back !== null) {
      g.bind(this.back);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawGlowLayer(true);
    }

    g.bind(this.scene);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawGlowLayer(false);

    /* Стекло: сзади вперёд; каждый объект — сначала задние грани, потом передние. */
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.CULL_FACE);
    const glassItems: { depth: number; draw: () => void }[] = [];
    const glassCommon = {
      ...common,
      uCore: core,
      uCoreI: coreI,
      ...(this.back !== null
        ? { uBack: this.back.tex, uRes: [this.pxW, this.pxH], uView: view }
        : {}),
    };
    for (const p of plates) {
      glassItems.push({
        depth: project(viewProj, p.center)[2],
        draw: () => {
          g.use(this.plateGlass, { ...glassCommon, uModel: p.m, uAlpha: reveal });
          this.twoSided(p.mesh);
        },
      });
    }
    for (const p of petals) {
      glassItems.push({
        depth: project(viewProj, p.center)[2],
        draw: () => {
          g.use(this.glass, { ...glassCommon, uModel: p.m, uAlpha: p.alpha });
          /* Жемчужные лепестки пишут глубину: рёбра граней за ними не
             просвечивают, как на кадре 3. */
          gl.depthMask(p.alpha > 0.5);
          this.twoSided(p.mesh);
          gl.depthMask(false);
        },
      });
    }
    glassItems.sort((x, y) => y.depth - x.depth);
    for (const item of glassItems) item.draw();
    gl.disable(gl.CULL_FACE);

    /* Свет ядра пробивается сквозь лепестки — ещё раз поверх стекла,
       но под тычинками: иначе он белит золото. */
    gl.disable(gl.DEPTH_TEST);
    this.drawSprite(viewProj, right, upv, core, [0.6, 0.6], 0, coreI);
    gl.enable(gl.DEPTH_TEST);

    /* Тычинки — после стекла: лепестки впереди закрывают их по глубине,
       а стекло сзади не белит золото. */
    if (stamenT > 0) {
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      drawStamens();
      gl.depthMask(false);
      gl.enable(gl.BLEND);
    }

    /* Золотые рёбра поверх стекла. */
    const edgeI = smooth(span(t, 0.15, 0.75)) * (1 + 0.2 * coreI);
    const backDim = 0.3 + 0.7 * smooth(span(t, 0.8, 1.6));
    gl.enable(gl.CULL_FACE);
    for (const p of plates) {
      g.use(this.edge, { ...common, uModel: p.m, uI: edgeI, uBackDim: backDim });
      g.draw(p.edges);
    }
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);

    /* Частицы и искры. */
    gl.disable(gl.DEPTH_TEST);
    const partI = (0.8 + 0.8 * smooth(span(t, 2.0, 3.2))) * smooth(span(t, 0.2, 0.9));
    g.use(this.particles, { ...common, uModel: group, uPx: pxScale, uI: partI });
    g.draw(this.particleMesh);
    const sparkI = 1.5 * smooth(span(t, 0.3, 0.8)) * (0.85 + 0.15 * Math.sin(t * 2.3));
    g.use(this.sparks, { ...common, uModel: translation([0, 0, 0]), uPx: pxScale, uI: sparkI });
    g.draw(this.sparkMesh);
    gl.depthMask(true);

    g.resolve(this.scene);
    this.post();
  }

  private uploadSparkExtra(): void {
    const gl = this.g.gl;
    gl.bindVertexArray(this.sparkMesh.vao);
    /* extra — третий буфер, привязан к атрибуту 2: обновляем через него. */
    const buf = gl.getVertexAttrib(2, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sparkExtra);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private twoSided(mesh: Mesh): void {
    const gl = this.g.gl;
    gl.cullFace(gl.FRONT);
    this.g.draw(mesh);
    gl.cullFace(gl.BACK);
    this.g.draw(mesh);
  }

  private drawSprite(
    viewProj: Mat4,
    right: Vec3,
    up: Vec3,
    center: Vec3,
    size: [number, number],
    kind: number,
    i: number,
  ): void {
    if (i <= 0) return;
    this.g.use(this.sprite, {
      uViewProj: viewProj,
      uCenter: center,
      uSize: size,
      uRight: right,
      uUp: up,
      uI: i,
    });
    this.g.int(this.sprite, 'uKind', kind);
    this.g.draw(this.quad);
  }

  /** Свечение и вывод на экран. */
  private post(): void {
    const g = this.g;
    const gl = g.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    const scene = this.scene!;
    const levels = this.bloomDown;
    g.bind(levels[0]!);
    g.use(this.prefilter, {
      uTex: scene.tex,
      uTexel: [1 / scene.w, 1 / scene.h],
      uThreshold: 1.1,
    });
    g.draw(this.quad);
    for (let i = 1; i < levels.length; i += 1) {
      const src = levels[i - 1]!;
      g.bind(levels[i]!);
      g.use(this.down, { uTex: src.tex, uTexel: [1 / src.w, 1 / src.h] });
      g.draw(this.quad);
    }
    let low = levels[levels.length - 1]!;
    for (let i = levels.length - 2; i >= 0; i -= 1) {
      const dst = this.bloomUp[i]!;
      g.bind(dst);
      g.use(this.up, {
        uTex: low.tex,
        uBase: levels[i]!.tex,
        uTexel: [1 / low.w, 1 / low.h],
        uSpread: 1,
      });
      g.draw(this.quad);
      low = dst;
    }
    g.bind(null, this.pxW, this.pxH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    g.use(this.composite, {
      uScene: scene.tex,
      uBloom: low.tex,
      uBloomI: this.d.bloom,
      uFade: 1,
      uStill: this.still ? 1 : 0,
    });
    g.draw(this.quad);
  }

  dispose(): void {
    this.g.dispose();
    this.scene = null;
    this.back = null;
    this.bloomDown = [];
    this.bloomUp = [];
    this.layout = null;
    /* Холст 1×1: браузер сразу отдаёт память под буфер кадра. */
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}

/* ── Камера ───────────────────────────────────────────────────── */

const BASE_POINT: Vec3 = [0, 0, 0];

function projection(unitPx: number, w: number, h: number, shiftX = 0, shiftY = 0): Mat4 {
  const fov = 2 * Math.atan(h / (2 * unitPx * CAM_DIST));
  return perspective(fov, w / h, 1, 40, shiftX, shiftY);
}

/** NDC нижней вершины без сдвига объектива. */
function baseNdc(unitPx: number, w: number, h: number, eye: Vec3): [number, number] {
  const vp = multiply(projection(unitPx, w, h), lookAt(eye, CAM_TARGET, UP));
  const p = project(vp, BASE_POINT);
  return [p[0], p[1]];
}

/**
 * Масштаб и положение кадра в момент t. До T_FLOWER цветок в центре
 * (на телефоне октаэдр крупнее, потом камера отходит, чтобы влез весь
 * цветок); с T_FLOWER до T_CARD — плавный переход к позе над окном.
 */
function camera(t: number, l: SceneLayout, eye: Vec3): { proj: Mat4; unitPx: number } {
  const { w, h } = l;
  const extent = 2.5 + (FLOWER_W - 0.1 - 2.5) * smooth(span(t, 0.8, 3.2));
  const push = 1 + 0.03 * span(t, 0, T_FLOWER);
  const introUnit = Math.min(0.265 * h * push, ((l.phone ? 0.92 : 0.7) * w) / extent);
  const centerY = (l.phone ? 0.44 : 0.47) * h;
  /* Где при этом нижняя вершина: центр кадра — CAM_TARGET. */
  const [bx, by] = baseNdc(introUnit, w, h, eye);
  const introBase: [number, number] = [w / 2 + (bx * w) / 2, centerY - (by * h) / 2];

  const q = easeInOutCubic(span(t, T_FLOWER, T_CARD));
  const unitPx = Math.exp(
    Math.log(introUnit) + (Math.log(l.final.unitPx) - Math.log(introUnit)) * q,
  );
  const sx = introBase[0] + (l.final.x - introBase[0]) * q;
  const sy = introBase[1] + (l.final.y - introBase[1]) * q;
  const [ax, ay] = baseNdc(unitPx, w, h, eye);
  const shiftX = (2 * sx) / w - 1 - ax;
  const shiftY = 1 - (2 * sy) / h - ay;
  return { proj: projection(unitPx, w, h, shiftX, shiftY), unitPx };
}
