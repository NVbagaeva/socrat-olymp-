/**
 * Плавающие векторы для рисования.
 *
 * Ядро (core/) считает точно — дробями. Рисунку точность не нужна:
 * здесь координаты уже числа, и всё, что зависит от поворота камеры,
 * пересчитывается каждый кадр.
 */

export type V = readonly [number, number, number];
export type P2 = readonly [number, number];

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a: V): number => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V): V => {
  const l = len(a);
  return l === 0 ? a : scale(a, 1 / l);
};
export const lerp = (a: V, b: V, t: number): V => add(a, scale(sub(b, a), t));
export const dist = (a: V, b: V): number => len(sub(a, b));

/** Центр масс вершин (для выпуклого тела — внутренняя точка). */
export function centroid(pts: readonly V[]): V {
  let s: V = [0, 0, 0];
  for (const p of pts) {
    s = add(s, p);
  }
  return scale(s, 1 / Math.max(pts.length, 1));
}

export const sub2 = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
export const len2 = (a: P2): number => Math.hypot(a[0], a[1]);

/** Ключ точки для сравнения «на одном месте» (до 1e-6 от размера). */
export function key(p: V, unit: number): string {
  const q = (x: number) => Math.round(x / (unit * 1e-6));
  return `${q(p[0])},${q(p[1])},${q(p[2])}`;
}
