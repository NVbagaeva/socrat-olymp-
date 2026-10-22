/**
 * Геометрия для сборки сценариев: сечение выпуклого тела плоскостью
 * и выпуклая оболочка набора вершин («многогранник, вершинами
 * которого являются точки…»). Плавающие числа: это рисунок, точные
 * ответы считает банк.
 */

import { type V, add, centroid, cross, dot, len, lerp, norm, scale, sub } from '@/lib/stereo/vec';

/** Упорядочить точки плоского выпуклого многоугольника обходом. */
export function uporyadochit(pts: readonly V[], n: V): V[] {
  const c = centroid(pts);
  const u = norm(sub(pts[0] as V, c));
  const w = cross(n, u);
  return [...pts].sort(
    (p, q) =>
      Math.atan2(dot(sub(p, c), w), dot(sub(p, c), u)) -
      Math.atan2(dot(sub(q, c), w), dot(sub(q, c), u)),
  );
}

function bezPovtorov(pts: readonly V[], eps: number): V[] {
  const out: V[] = [];
  for (const p of pts) if (!out.some((q) => len(sub(p, q)) < eps)) out.push(p);
  return out;
}

/**
 * Сечение выпуклого тела (вершины и рёбра индексами) плоскостью через
 * три точки: вершины многоугольника в порядке обхода.
 */
export function sechenie(
  vershiny: readonly V[],
  rebra: readonly (readonly [number, number])[],
  a: V,
  b: V,
  c: V,
  eps: number,
): V[] {
  const n = norm(cross(sub(b, a), sub(c, a)));
  const d = (p: V) => dot(n, sub(p, a));
  const pts: V[] = [];
  for (const [i, j] of rebra) {
    const p = vershiny[i] as V;
    const q = vershiny[j] as V;
    const dp = d(p);
    const dq = d(q);
    if (Math.abs(dp) < eps) pts.push(p);
    if (Math.abs(dq) < eps) pts.push(q);
    if ((dp > eps && dq < -eps) || (dp < -eps && dq > eps)) pts.push(lerp(p, q, dp / (dp - dq)));
  }
  const u = bezPovtorov(pts, eps);
  return u.length >= 3 ? uporyadochit(u, n) : u;
}

/**
 * Выпуклая оболочка точек: грани индексами (каждая — в порядке
 * обхода). Перебор троек: точек в задачах №3 не больше двенадцати.
 */
export function obolochka(pts: readonly V[], eps: number): number[][] {
  const grani: number[][] = [];
  const seen = new Set<string>();
  const c = centroid(pts);
  for (let i = 0; i < pts.length; i += 1)
    for (let j = i + 1; j < pts.length; j += 1)
      for (let k = j + 1; k < pts.length; k += 1) {
        const [a, b, q] = [pts[i] as V, pts[j] as V, pts[k] as V];
        const nn = cross(sub(b, a), sub(q, a));
        if (len(nn) < eps * eps) continue;
        let n = norm(nn);
        if (dot(n, sub(c, a)) > 0) n = scale(n, -1);
        const ds = pts.map((p) => dot(n, sub(p, a)));
        if (ds.some((x) => x > eps)) continue;
        const na = ds.map((x, m) => (Math.abs(x) <= eps ? m : -1)).filter((m) => m >= 0);
        const key = na.join(',');
        if (seen.has(key)) continue;
        seen.add(key);
        const ordered = uporyadochit(
          na.map((m) => pts[m] as V),
          n,
        );
        grani.push(ordered.map((p) => na.find((m) => pts[m] === p) as number));
      }
  return grani;
}

/** Середина отрезка — для удобства сборщиков. */
export function seredina(a: V, b: V): V {
  return scale(add(a, b), 0.5);
}
