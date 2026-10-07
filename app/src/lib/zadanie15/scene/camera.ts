/**
 * Камера сцены задания №15: орбитальная, ортографическая.
 *
 * Два угла — поворот вокруг вертикали (yaw) и подъём над горизонтом
 * (pitch). Проекция без перспективы: так же рисуют чертежи в учебнике
 * и движок solid/ задания №3, и параллельные рёбра остаются
 * параллельными на экране. Оси пространства: x вправо, y в глубину,
 * z вверх — как в ядре (box: x вдоль AB, y вдоль AD, z вдоль AA_1).
 *
 * Положение по умолчанию совпадает с ортогональным видом solid/
 * (азимут 28°, подъём 25°), чтобы куб на экране выглядел как на
 * остальных чертежах сайта.
 */

export type Vec = readonly [number, number, number];
export type P2 = readonly [number, number];

export interface Camera {
  /** Поворот вокруг вертикали, радианы. */
  yaw: number;
  /** Подъём взгляда над горизонтом, радианы; |pitch| < π/2. */
  pitch: number;
}

/** Ортонормированный базис экрана: вправо, вверх, на зрителя. */
export interface Basis {
  right: Vec;
  up: Vec;
  toward: Vec;
}

const DEG = Math.PI / 180;
export const DEFAULT_CAMERA: Camera = { yaw: 28 * DEG, pitch: 25 * DEG };
/** Взгляд почти сверху ещё различает направление «вперёд»; ровно сверху — нет. */
export const MAX_PITCH = 89.5 * DEG;

export const vdot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vsub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vadd = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vscale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const vcross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const vlen = (a: Vec): number => Math.hypot(a[0], a[1], a[2]);
export function vnorm(a: Vec): Vec {
  const l = vlen(a);
  return l === 0 ? a : vscale(a, 1 / l);
}
export const vlerp = (a: Vec, b: Vec, t: number): Vec => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export function basisOf(cam: Camera): Basis {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const right: Vec = [cy, sy, 0];
  const toward: Vec = [cp * sy, -cp * cy, sp];
  const up: Vec = vcross(toward, right);
  return { right, up, toward };
}

/** Точка пространства на экране: X вправо, Y вниз. Масштаб и сдвиг — у сцены. */
export const project = (b: Basis, p: Vec): P2 => [vdot(p, b.right), -vdot(p, b.up)];

/** Глубина: у более близкой к зрителю точки больше. */
export const depthOf = (b: Basis, p: Vec): number => vdot(p, b.toward);

/** Угол в (−π; π]. */
export function wrapAngle(a: number): number {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

export function clampPitch(pitch: number): number {
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
}

/**
 * Камера, смотрящая перпендикулярно плоскости с нормалью n.
 * Из двух сторон берётся та, что ближе к текущему взгляду, — камера
 * доворачивается, а не перескакивает на обратную сторону.
 */
export function facingPlane(n: Vec, current: Camera): Camera {
  const unit = vnorm(n);
  const now = basisOf(current).toward;
  const t = vdot(unit, now) >= 0 ? unit : vscale(unit, -1);
  const pitch = clampPitch(Math.asin(Math.max(-1, Math.min(1, t[2]))));
  const flat = Math.hypot(t[0], t[1]);
  /* Взгляд строго сверху не задаёт поворота — оставляем текущий. */
  const yaw = flat < 1e-6 ? current.yaw : Math.atan2(t[0], -t[1]);
  return { yaw: current.yaw + wrapAngle(yaw - current.yaw), pitch };
}

/** Промежуточная камера на пути из a в b, по кратчайшей дуге поворота. */
export function lerpCamera(a: Camera, b: Camera, t: number): Camera {
  const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  return {
    yaw: a.yaw + wrapAngle(b.yaw - a.yaw) * ease,
    pitch: a.pitch + (b.pitch - a.pitch) * ease,
  };
}

/** Поворот камеры пальцем или мышью: сдвиг в пикселях → углы. */
export function orbit(cam: Camera, dx: number, dy: number, pxPerRadian = 160): Camera {
  return {
    yaw: cam.yaw + dx / pxPerRadian,
    pitch: clampPitch(cam.pitch + dy / pxPerRadian),
  };
}
