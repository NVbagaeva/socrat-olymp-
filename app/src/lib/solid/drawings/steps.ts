/**
 * Ступенчатые многогранники: P03-05 (площадь поверхности) и P03-11
 * (объём). Это единственные прототипы, где числа стоят на самом
 * чертеже, поэтому у каждого варианта чертёж свой.
 *
 * Тело — призма над ступенчатым профилем, вытянутая в глубину. Здесь
 * только сборщик: сами профили вариантов лежат в данных прототипов
 * (zadanie3/razdel1/stupeni.ts), чтобы числа не оказались в двух
 * местах сразу.
 */

import { type Measure, type Model, type Polyhedron } from '../model';
import { faceNormal } from '../model';
import { type Vec3, at, dot } from '../vec';

/**
 * Ступенька: W — вся ширина, H — высота высокой части, h — высота
 * низкой, w — ширина высокой части, depth — глубина.
 */
export interface Step {
  W: number;
  H: number;
  w: number;
  h: number;
  depth: number;
}

/** Профиль ступеньки в плоскости xz, обход против часовой стрелки. */
function profile(step: Step): [number, number][] {
  const { W, H, w, h } = step;
  return [
    [0, 0],
    [W, 0],
    [W, h],
    [w, h],
    [w, H],
    [0, H],
  ];
}

/**
 * Призма над ступенчатым профилем. Грани ориентированы наружу
 * по двумерной нормали ребра: тело невыпуклое, и по центру
 * ориентацию определить нельзя.
 */
export function stepBody(step: Step): Polyhedron {
  const flat = profile(step);
  const n = flat.length;
  const vertices: Vec3[] = [
    ...flat.map(([x, z]): Vec3 => [x, 0, z]),
    ...flat.map(([x, z]): Vec3 => [x, step.depth, z]),
  ];

  const front = Array.from({ length: n }, (_, i) => i);
  const back = Array.from({ length: n }, (_, i) => 2 * n - 1 - i);
  const faces: number[][] = [front, back];

  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const a = at(flat, i);
    const b = at(flat, j);
    /* Наружная нормаль ребра профиля: у обхода против часовой
       стрелки это (dz, −dx). */
    const outward: Vec3 = [b[1] - a[1], 0, -(b[0] - a[0])];
    const quad = [i, j, n + j, n + i];
    const straight = dot(faceNormal(vertices, quad), outward) > 0;
    faces.push(straight ? quad : quad.slice().reverse());
  }

  return { kind: 'polyhedron', vertices, faces, names: vertices.map(() => null) };
}

/** Подписи ступеньки: те же шесть чисел, что в задачнике. */
function stepMeasures(step: Step): Measure[] {
  const { W, H, w, h, depth } = step;
  const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
  const num = (value: number) => value.toString().replace('.', ',');
  return [
    { a: p(0, 0, 0), b: p(W, 0, 0), text: num(W) },
    { a: p(0, 0, H), b: p(0, 0, 0), text: num(H) },
    { a: p(W, depth, h), b: p(W, depth, 0), text: num(h) },
    { a: p(w, depth, h), b: p(W, depth, h), text: num(W - w) },
    { a: p(w, depth, H), b: p(w, depth, h), text: num(H - h) },
    { a: p(W, 0, 0), b: p(W, depth, 0), text: num(depth) },
  ];
}

export function stepModel(alt: string, step: Step): Model {
  return {
    alt,
    view: 'cabinet',
    bodies: [stepBody(step)],
    measures: stepMeasures(step),
  };
}

/** Описание для голосового доступа. */
export function stepAlt(step: Step): string {
  const { W, H, w, h, depth } = step;
  return (
    `Ступенчатый многогранник, все двугранные углы прямые: ширина ${W}, глубина ${depth}, ` +
    `высокая часть шириной ${w} и высотой ${H}, низкая часть шириной ${W - w} и высотой ${h}`
  );
}
