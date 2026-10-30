/**
 * Геометрия №19 (b19.koren4): общие точки прямой y = a(t − m) − c с дугой
 * √(R² − t²), t ∈ [0; R]. Без зависимостей — модуль берут и шаблон
 * решения, и живой рисунок в браузере (grafikZhivoy.ts).
 */

export interface GeomB19 {
  R: number;
  c: number;
  m: number;
}

/** Точки пересечения прямой y = a(t − m) − c с дугой: t ∈ [0; R], y ≥ 0. */
export function tochkiDugi(p: GeomB19, a: number): number[] {
  const b = -a * p.m - p.c;
  const A = 1 + a * a;
  const B = 2 * a * b;
  const C = b * b - p.R * p.R;
  const D = B * B - 4 * A * C;
  const eps = 1e-9;
  if (D < -eps) return [];
  const sq = Math.sqrt(Math.max(0, D));
  const ts = D <= eps ? [-B / (2 * A)] : [(-B - sq) / (2 * A), (-B + sq) / (2 * A)];
  return ts
    .filter((t) => t >= -eps && t <= p.R + eps && a * t + b >= -eps)
    .map((t) => Math.max(0, t));
}

/** Число решений исходного уравнения при данном a: t > 0 даёт два x, t = 0 — один. */
export function chisloResheniy(p: GeomB19, a: number): number {
  return tochkiDugi(p, a).reduce((s, t) => s + (t < 1e-9 ? 1 : 2), 0);
}
