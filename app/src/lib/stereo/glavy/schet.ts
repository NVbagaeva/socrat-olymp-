/**
 * Счёт по координатам для пересчёта ответов глав (pereschet): длины,
 * углы, объём и площадь поверхности многогранника. Независим от текста
 * решения: ответ главы сверяется с тем, что даёт сам чертёж.
 */

import type { Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';

export const P = (x: number, y: number, z: number): Vec3 => [x, y, z];

export function raz(a: Vec3, b: Vec3): Vec3 {
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
}

export function dlina(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

export function seredina(a: Vec3, b: Vec3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function skal(u: Vec3, v: Vec3): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

function vekt(u: Vec3, v: Vec3): Vec3 {
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/** Угол между прямыми (не между векторами), градусы: от 0 до 90. */
export function ugolPryamyh(a1: Vec3, b1: Vec3, a2: Vec3, b2: Vec3): number {
  const u = raz(a1, b1);
  const v = raz(a2, b2);
  const c = Math.abs(skal(u, v)) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.min(1, c)) * 180) / Math.PI;
}

/** Угол AOB, градусы. */
export function ugol(a: Vec3, o: Vec3, b: Vec3): number {
  const u = raz(o, a);
  const v = raz(o, b);
  const c = skal(u, v) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

/** Площадь плоского многоугольника в пространстве. */
export function ploshchadMnogougolnika(points: readonly Vec3[]): number {
  let s: Vec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i] as Vec3;
    const b = points[(i + 1) % points.length] as Vec3;
    const c = vekt(a, b);
    s = [s[0] + c[0], s[1] + c[1], s[2] + c[2]];
  }
  return Math.hypot(...s) / 2;
}

/** Площадь поверхности многогранника: сумма площадей граней. */
export function ploshchadPoverhnosti(body: Polyhedron): number {
  return body.faces.reduce(
    (sum, face) => sum + ploshchadMnogougolnika(face.map((i) => body.vertices[i] as Vec3)),
    0,
  );
}

/**
 * Объём многогранника по граням (формула Гаусса — Остроградского для
 * треугольников веером из первой вершины грани). Грани движка
 * ориентированы наружу; знак всё равно снимаем модулем.
 */
export function obemMnogogrannika(body: Polyhedron): number {
  let v = 0;
  body.faces.forEach((face) => {
    const p0 = body.vertices[face[0] as number] as Vec3;
    for (let k = 1; k + 1 < face.length; k += 1) {
      const p1 = body.vertices[face[k] as number] as Vec3;
      const p2 = body.vertices[face[k + 1] as number] as Vec3;
      v += skal(p0, vekt(p1, p2)) / 6;
    }
  });
  return Math.abs(v);
}

/** Объём тетраэдра по четырём точкам. */
export function obemTetraedra(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  return Math.abs(skal(raz(a, b), vekt(raz(a, c), raz(a, d)))) / 6;
}

/** Округление для сверки: ответы №3 — целые или конечные дроби. */
export function okr(x: number): number {
  return Math.round(x * 1e9) / 1e9;
}

/**
 * Пересчёт с проверкой чертежа: если данные условия на модели не
 * выполнены (рёбра не те), ответ — NaN, и тест падает.
 */
export function pri(usloviya: readonly (readonly [number, number])[], x: number): number {
  return usloviya.every(([est, nado]) => Math.abs(est - nado) < 1e-9) ? x : Number.NaN;
}

/** Площадь поверхности тела из единичных кубиков: грани, не общие с соседом. */
export function ploshchadKubikov(kubiki: readonly (readonly [number, number, number])[]): number {
  const est = new Set(kubiki.map((k) => k.join(',')));
  const sosedi = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ] as const;
  let s = 0;
  kubiki.forEach(([x, y, z]) => {
    sosedi.forEach(([dx, dy, dz]) => {
      if (!est.has(`${x + dx},${y + dy},${z + dz}`)) s += 1;
    });
  });
  return s;
}
