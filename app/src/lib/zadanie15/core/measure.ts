/**
 * Расчёты по сечению — точно, с корнями.
 *
 * Площадь: половина длины суммы векторных произведений соседних
 * вершин. Периметр: сумма корней из квадратов сторон. Угол между
 * плоскостями: косинус |n₁·n₂| / (|n₁||n₂|) и тангенс. Расстояние
 * от точки до плоскости: |n·P − c| / |n|. Все величины — Surd или
 * SurdSum, приближённые значения только для показа.
 */

import { at } from './polyhedron';
import { type Rat, ONE, abs, div, isZero, mul, rat, sub as rsub } from './rational';
import { type Surd, type SurdSum, sqrtRat, surdScale, surdSum } from './surd';
import { type Plane, type V3, add, cross, dot, len2, side } from './vec';

/** Площадь выпуклого многоугольника в пространстве. */
export function area(pts: V3[]): Surd {
  const n = pts.length;
  if (n < 3) return sqrtRat(rat(0));
  let s = cross(at(pts, 0), at(pts, 1));
  for (let i = 1; i < n; i++) s = add(s, cross(at(pts, i), at(pts, (i + 1) % n)));
  return surdScale(sqrtRat(len2(s)), rat(1, 2));
}

/** Длина отрезка. */
export const length = (a: V3, b: V3): Surd => {
  const d = { x: rsub(b.x, a.x), y: rsub(b.y, a.y), z: rsub(b.z, a.z) };
  return sqrtRat(len2(d));
};

/** Периметр многоугольника: сумма корней с приведением подобных. */
export function perimeter(pts: V3[]): SurdSum {
  return surdSum(pts.map((p, i) => length(p, at(pts, (i + 1) % pts.length))));
}

/** Косинус угла между плоскостями: |n₁·n₂| / √(|n₁|²|n₂|²). */
export function cosPlanes(a: Plane, b: Plane): Surd {
  const num = abs(dot(a.n, b.n));
  const den2 = mul(len2(a.n), len2(b.n));
  // num / √den2 = num·√den2 / den2
  return surdScale(sqrtRat(den2), div(num, den2));
}

/** Квадрат косинуса угла между плоскостями — дробь. */
export function cos2Planes(a: Plane, b: Plane): Rat {
  const d = dot(a.n, b.n);
  return div(mul(d, d), mul(len2(a.n), len2(b.n)));
}

/**
 * Тангенс угла между плоскостями: √(1 − cos²) / cos. null — плоскости
 * перпендикулярны (тангенс не определён).
 */
export function tanPlanes(a: Plane, b: Plane): Surd | null {
  const c2 = cos2Planes(a, b);
  if (isZero(c2)) return null;
  // tg² = (1 − cos²) / cos²
  return sqrtRat(div(rsub(ONE, c2), c2));
}

/** Синус угла между плоскостями. */
export function sinPlanes(a: Plane, b: Plane): Surd {
  return sqrtRat(rsub(ONE, cos2Planes(a, b)));
}

/** Угол в градусах — только для показа. */
export function anglePlanesDeg(a: Plane, b: Plane): number {
  const c2 = cos2Planes(a, b);
  return (Math.acos(Math.sqrt(Number(c2.n) / Number(c2.d))) * 180) / Math.PI;
}

/** Расстояние от точки до плоскости. */
export function distance(p: V3, pl: Plane): Surd {
  const num = abs(side(pl, p));
  const n2 = len2(pl.n);
  return surdScale(sqrtRat(n2), div(num, n2));
}
