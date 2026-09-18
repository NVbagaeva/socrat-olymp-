/**
 * Векторы в пространстве и на плоскости.
 *
 * Кортежи, а не объекты: модель фигуры — это списки координат, и
 * читать «[a, 0, h]» проще, чем «{ x: a, y: 0, z: h }». Оси: x вправо,
 * y в глубину (от зрителя), z вверх.
 */

export type Vec3 = readonly [number, number, number];
export type Vec2 = readonly [number, number];

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function normalize(a: Vec3): Vec3 {
  const len = length(a);
  return len === 0 ? a : scale(a, 1 / len);
}

/** Точка на отрезке: t = 0 — a, t = 1 — b. */
export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mid(a: Vec3, b: Vec3): Vec3 {
  return lerp(a, b, 0.5);
}

/** Среднее арифметическое точек: центр многоугольника или тела. */
export function centroid(points: readonly Vec3[]): Vec3 {
  if (points.length === 0) {
    return [0, 0, 0];
  }
  const sum = points.reduce<Vec3>((acc, p) => add(acc, p), [0, 0, 0]);
  return scale(sum, 1 / points.length);
}

export function dist2(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Расстояние от точки до отрезка на плоскости. */
export function segmentDistance2(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return dist2(p, a);
  }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return dist2(p, [a[0] + dx * t, a[1] + dy * t]);
}

/** Элемент списка, которого не может не быть. */
export function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`Нет элемента ${index} из ${list.length}`);
  }
  return item;
}
