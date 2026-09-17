/**
 * Измерения по трёхмерной модели: длины, площади, объёмы и углы
 * прямо из координат.
 *
 * Это вторая, независимая дорога к ответу задачи. Первая — формула
 * прототипа («половина произведения рёбер»), вторая — эти функции по
 * той самой модели, которую рисует движок. Совпадение двух дорог и
 * есть двойная проверка варианта: ошибку в формуле или в модели видно
 * сразу, потому что считают они разными способами.
 *
 * Никаких пикселей и никакой проекции здесь нет: только геометрия.
 */

import { type Polyhedron } from './model';
import { at, cross, dot, length, sub, type Vec3 } from './vec';

/** Длина отрезка между двумя точками. */
export function distance(a: Vec3, b: Vec3): number {
  return length(sub(b, a));
}

/**
 * Площадь плоского многоугольника по вершинам в порядке обхода.
 * Считается векторным произведением, поэтому работает в любой
 * плоскости, а не только в горизонтальной.
 */
export function polygonArea(points: readonly Vec3[]): number {
  if (points.length < 3) {
    return 0;
  }
  const p0 = at(points, 0);
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (let i = 1; i + 1 < points.length; i += 1) {
    const n = cross(sub(at(points, i), p0), sub(at(points, i + 1), p0));
    sx += n[0];
    sy += n[1];
    sz += n[2];
  }
  return length([sx, sy, sz]) / 2;
}

/** Угол между прямыми в градусах: от 0 до 90, направление не важно. */
export function angleBetweenLines(u: Vec3, v: Vec3): number {
  const cos = Math.abs(dot(u, v)) / (length(u) * length(v));
  return (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
}

/** Синус угла между прямыми. */
export function sinBetweenLines(u: Vec3, v: Vec3): number {
  const n = cross(u, v);
  return length(n) / (length(u) * length(v));
}

/**
 * Объём многогранника по его граням (теорема о дивергенции).
 * Грани должны быть ориентированы наружу — так их и собирают
 * фигуры движка. Работает и на невыпуклых телах: ступенчатый
 * многогранник считается этой же функцией.
 */
export function polyhedronVolume(body: Polyhedron): number {
  let sum = 0;
  body.faces.forEach((face) => {
    const p0 = at(body.vertices, at(face, 0));
    for (let i = 1; i + 1 < face.length; i += 1) {
      const a = at(body.vertices, at(face, i));
      const b = at(body.vertices, at(face, i + 1));
      sum += dot(p0, cross(sub(a, p0), sub(b, p0)));
    }
  });
  return Math.abs(sum) / 6;
}

/** Площадь полной поверхности многогранника: сумма площадей граней. */
export function surfaceArea(body: Polyhedron): number {
  return body.faces.reduce(
    (sum, face) => sum + polygonArea(face.map((i) => at(body.vertices, i))),
    0,
  );
}

const EPS = 1e-9;

/** Одна и та же точка с точностью до погрешности. */
function same(a: Vec3, b: Vec3): boolean {
  return distance(a, b) < EPS;
}

/**
 * Объём выпуклой оболочки набора точек.
 *
 * Нужен там, где тело задано только перечнем вершин: «многогранник
 * с вершинами A, B, C, A₁, B₁» из условия задачи. Грани при этом
 * не задаются руками — они находятся сами, и объём получается
 * независимо от того, как эти же вершины собраны в модели.
 *
 * Как считается: перебираются все тройки точек, каждая задаёт
 * плоскость; если все остальные точки лежат по одну её сторону —
 * это грань оболочки. Точки, попавшие в эту плоскость, дают
 * многоугольник грани, а объём складывается из конусов от
 * внутренней точки к каждой грани. Тройки одной грани дают одну
 * и ту же плоскость, поэтому плоскости сначала сводятся к
 * уникальным.
 */
export function hullVolume(input: readonly Vec3[]): number {
  const points: Vec3[] = [];
  input.forEach((p) => {
    if (!points.some((q) => same(p, q))) {
      points.push(p);
    }
  });
  if (points.length < 4) {
    return 0;
  }

  /* Внутренняя точка: середина набора. У выпуклой оболочки она
     заведомо внутри, если тело не плоское. */
  const inner: Vec3 = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
    points.reduce((s, p) => s + p[2], 0) / points.length,
  ];

  const planes: { n: Vec3; d: number; on: Vec3[] }[] = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      for (let k = j + 1; k < points.length; k += 1) {
        const a = at(points, i);
        const b = at(points, j);
        const c = at(points, k);
        const raw = cross(sub(b, a), sub(c, a));
        const len = length(raw);
        if (len < EPS) {
          continue;
        }
        let n: Vec3 = [raw[0] / len, raw[1] / len, raw[2] / len];
        let d = dot(n, a);
        /* Нормаль наружу: внутренняя точка должна быть под плоскостью. */
        if (dot(n, inner) > d) {
          n = [-n[0], -n[1], -n[2]];
          d = -d;
        }
        /* Все точки по одну сторону — иначе это не грань. */
        const outside = points.some((p) => dot(n, p) > d + 1e-7);
        if (outside) {
          continue;
        }
        const known = planes.some((pl) => Math.abs(pl.d - d) < 1e-7 && distance(pl.n, n) < 1e-7);
        if (known) {
          continue;
        }
        planes.push({ n, d, on: points.filter((p) => Math.abs(dot(n, p) - d) < 1e-7) });
      }
    }
  }

  let volume = 0;
  planes.forEach((plane) => {
    const ordered = orderAround(plane.on, plane.n);
    const area = polygonArea(ordered);
    const height = plane.d - dot(plane.n, inner);
    volume += (area * height) / 3;
  });
  return volume;
}

/** Точки одной плоскости по кругу: иначе площадь многоугольника неверна. */
function orderAround(points: readonly Vec3[], n: Vec3): Vec3[] {
  const center: Vec3 = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
    points.reduce((s, p) => s + p[2], 0) / points.length,
  ];
  /* Пара осей в плоскости: любая, лишь бы ортогональная нормали. */
  const seed: Vec3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const ux = cross(n, seed);
  const ul = length(ux);
  const u: Vec3 = [ux[0] / ul, ux[1] / ul, ux[2] / ul];
  const v = cross(n, u);
  return points
    .map((p) => {
      const w = sub(p, center);
      return { p, a: Math.atan2(dot(w, v), dot(w, u)) };
    })
    .sort((x, y) => x.a - y.a)
    .map((item) => item.p);
}
