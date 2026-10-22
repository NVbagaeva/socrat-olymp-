/**
 * Виды: как модель в пространстве ложится на плоскость чертежа.
 *
 * Видов два, и это не прихоть, а геометрия.
 *
 * ortho — ортогональная проекция, взгляд спереди-справа и сверху.
 * Горизонтальная окружность в ней даёт симметричный эллипс с
 * горизонтальной большой осью, шар — круг. Так рисуют цилиндры, конусы,
 * шары и их комбинации.
 *
 * cabinet — косоугольная (кабинетная) проекция: X = x + a·y,
 * Y = −(z + b·y). Ребро вдоль оси x ложится строго горизонтально,
 * вертикали вертикальны, глубина уходит вправо-вверх. Так рисуют призмы,
 * параллелепипеды и куб: переднее ребро AB горизонтально.
 *
 * Одним видом обойтись нельзя. Горизонтальное AB при диагональном AD
 * требует, чтобы луч зрения не был перпендикулярен плоскости чертежа,
 * а при таком луче шар проецируется в эллипс, и горизонтальная
 * окружность кренится. Ортогональная проекция, наоборот, держит круги
 * ровными, но горизонтальным в ней может быть только одно направление
 * основания, и перпендикулярное ему встаёт вертикально.
 *
 * Внутри одного чертежа вид всегда один: комбинации тел (шар в кубе,
 * призма в цилиндре) рисуются целиком в ortho, иначе вписанное тело
 * перестало бы касаться описанного.
 *
 * Оси в пространстве: x вправо, y в глубину (от зрителя), z вверх.
 */

import { type Vec2, type Vec3, add, cross, dot, normalize, scale } from './vec';

export type ViewId = 'ortho' | 'cabinet';

export interface View {
  id: ViewId;
  /** Точка чертежа: X вправо, Y вниз, как в SVG. */
  project(p: Vec3): Vec2;
  /** Глубина: у более близкой к зрителю точки больше. */
  depth(p: Vec3): number;
  /** Направление на зрителя, вдоль проецирующего луча. */
  toward: Vec3;
  /** Любая точка луча, проходящего через точку чертежа. */
  rayPoint(q: Vec2): Vec3;
  /** Точка горизонтальной окружности; угол — в системе вида. */
  circlePoint(center: Vec3, r: number, u: number): Vec3;
  /** Угол контурной образующей цилиндра; вторая — на π больше. */
  silhouette: number;
  /** Ближняя половина горизонтальной окружности: она видна. */
  nearSide(u: number): boolean;
  /** Насколько контурная образующая конуса отстоит от контура цилиндра. */
  coneTangent(r: number, apexHeight: number): number;
  /** Точка контура шара: большой круг, перпендикулярный лучу зрения. */
  spherePoint(center: Vec3, r: number, u: number): Vec3;
  /** С какого угла обходится правильное основание в этом виде. */
  polygonStart(n: number): number;
}

/* Контур шара строится одинаково в любом виде: в плоскости,
   перпендикулярной лучу зрения. */
function ringBasis(toward: Vec3): [Vec3, Vec3] {
  const x = normalize([toward[1], -toward[0], 0]);
  return [x, normalize(cross(toward, x))];
}

function sphereOn(toward: Vec3) {
  const [ex, ey] = ringBasis(toward);
  return (center: Vec3, r: number, u: number): Vec3 =>
    add(center, add(scale(ex, -r * Math.cos(u)), scale(ey, r * Math.sin(u))));
}

/* ── Ортогональная проекция ──────────────────────────────────────
   Поворот вокруг вертикали (азимут) и подъём взгляда над горизонтом.
   Углы по умолчанию подобраны так, чтобы ни одно ребро основания не
   легло вдоль луча зрения и ни одна вершина не встала на ось чертежа.
   Живой чертёж (components/stereo/Chertezh3d) берёт тот же вид с
   другими углами — его вращает ученик. */

/** Ракурс по умолчанию, градусы. */
export const ORTHO_AZIMUTH = 28;
export const ORTHO_ELEVATION = 25;

/** С какого угла обходится правильное основание: подобрано под ракурс по умолчанию. */
function orthoPolygonStart(n: number): number {
  switch (n) {
    case 3:
      return 162.5;
    case 4:
      return 225;
    case 5:
      return 200;
    case 6:
      return 217.5;
    default:
      return 270 - 360 / n / 2 - 360 / n;
  }
}

/**
 * Ортогональный вид под заданным ракурсом: азимут — поворот вокруг
 * вертикали, подъём — угол взгляда над горизонтом (градусы; подъём
 * от −89 до 89).
 */
export function orthoAt(azimuth: number, elevation: number): View {
  const a = (azimuth * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  const cosA = Math.cos(a);
  const sinA = Math.sin(a);
  const cosE = Math.cos(e);
  const sinE = Math.sin(e);
  const right: Vec3 = [cosA, sinA, 0];
  const up: Vec3 = [-sinA * sinE, cosA * sinE, cosE];
  const toward: Vec3 = [sinA * cosE, -cosA * cosE, sinE];
  return {
    id: 'ortho',
    project: (p) => [dot(p, right), -dot(p, up)],
    depth: (p) => dot(p, toward),
    toward,
    rayPoint: (q) => add(scale(right, q[0]), scale(up, -q[1])),
    /* Угол отсчитывается от направления взгляда: тогда контурные
       образующие цилиндра стоят на 0 и π. */
    circlePoint: (center, r, u) => [
      center[0] + r * (Math.cos(u) * cosA - Math.sin(u) * sinA),
      center[1] + r * (Math.cos(u) * sinA + Math.sin(u) * cosA),
      center[2],
    ],
    silhouette: 0,
    /* Ближняя половина — та, что к зрителю; при взгляде снизу ближней
       остаётся та же сторона окружности, видимость основания решает
       нормаль. */
    nearSide: (u) => Math.sin(u) < 1e-9,
    coneTangent: (r, apexHeight) =>
      Math.asin(Math.min(1, ((r / apexHeight) * Math.abs(sinE)) / cosE)),
    spherePoint: sphereOn(toward),
    polygonStart: orthoPolygonStart,
  };
}

export const ortho: View = orthoAt(ORTHO_AZIMUTH, ORTHO_ELEVATION);

/* ── Косоугольная проекция ───────────────────────────────────────
   Ось глубины под 60° с сокращением 0,4 — как в старых чертежах. */

const DEPTH_ANGLE = (60 * Math.PI) / 180;
const DEPTH_SCALE = 0.4;
const DEPTH_X = DEPTH_SCALE * Math.cos(DEPTH_ANGLE);
const DEPTH_Y = DEPTH_SCALE * Math.sin(DEPTH_ANGLE);

const CABINET_TOWARD: Vec3 = normalize([DEPTH_X, -1, DEPTH_Y]);

export const cabinet: View = {
  id: 'cabinet',
  project: (p) => [p[0] + DEPTH_X * p[1], -(p[2] + DEPTH_Y * p[1])],
  depth: (p) => dot(p, CABINET_TOWARD),
  toward: CABINET_TOWARD,
  rayPoint: (q) => [q[0], 0, -q[1]],
  /* Угол отсчитывается от оси x. */
  circlePoint: (center, r, u) => [
    center[0] + r * Math.cos(u),
    center[1] + r * Math.sin(u),
    center[2],
  ],
  silhouette: Math.atan(DEPTH_X),
  nearSide: (u) => Math.sin(u - Math.atan(DEPTH_X)) < 1e-9,
  coneTangent: (r, apexHeight) =>
    Math.asin(Math.min(1, (r * DEPTH_Y) / (apexHeight * Math.hypot(1, DEPTH_X)))),
  spherePoint: sphereOn(CABINET_TOWARD),
  /* Сторона AB спереди и горизонтальна. */
  polygonStart: (n) => 270 - 180 / n,
};

export function viewOf(id: ViewId | undefined): View {
  return id === 'cabinet' ? cabinet : ortho;
}
