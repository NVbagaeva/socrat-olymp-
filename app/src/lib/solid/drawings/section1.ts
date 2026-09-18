/**
 * Раздел I. Параллелепипед и куб: прототипы P03-01 … P03-19.
 *
 * Здесь не готовые картинки, а сборщики: какие прямые выделить и
 * какое сечение закрасить, решает вариант задачи. Один прототип —
 * один сборщик, поэтому у десяти вариантов один чертёж на десять,
 * а не десять похожих копий.
 *
 * Пропорции тел выбраны так, чтобы чертёж читался: числа условия
 * на чертёж не выносятся — в задачнике их там нет. Исключение —
 * ступенчатые многогранники P03-05 и P03-11, у них числа стоят
 * на самом чертеже, и они собираются в steps.ts.
 */

import { box } from '../figures';
import { type Model, type Polyhedron } from '../model';
import { edge, face, lift, midEdge, prismModel, unlabelled } from './common';

/* Прямоугольный параллелепипед: переднее ребро, глубина, высота. */
const BOX: [number, number, number] = [5, 3, 3.6];
/* Куб. */
const CUBE = 4;
/* Правильная четырёхугольная призма: основание квадрат, призма выше куба. */
const PRISM: [number, number, number] = [3.4, 3.4, 4.8];

export const NAMES = 'ABCDA₁B₁C₁D₁';

/** Какое тело берём под чертёж. */
export type Shape = 'box' | 'cube' | 'prism';

/** Тело под чертёж: пропорции схематические, не по числам условия. */
export function bodyOf(shape: Shape): Polyhedron {
  switch (shape) {
    case 'cube':
      return box(CUBE, CUBE, CUBE);
    case 'prism':
      return box(...PRISM);
    default:
      return box(...BOX);
  }
}

/** Ребро или диагональ по именам вершин. */
export type Pair = readonly [string, string];

/**
 * Тело с выделенными прямыми: диагональ параллелепипеда, пара прямых
 * для угла, рёбра пирамиды внутри параллелепипеда.
 */
export function shapeLines(
  shape: Shape,
  alt: string,
  pairs: readonly Pair[],
  options: { letters?: boolean } = {},
): Model {
  const body = bodyOf(shape);
  const lines = pairs.map(([from, to]) => edge(body, from, to));
  return prismModel(alt, options.letters === false ? unlabelled(body) : body, { lines });
}

/** Тело с закрашенным сечением по вершинам в порядке обхода. */
export function shapeSection(shape: Shape, alt: string, names: readonly string[]): Model {
  const body = bodyOf(shape);
  const section = face(body, ...names);
  return prismModel(alt, body, { sections: [section] });
}

/**
 * Куб с отсечённой треугольной призмой: плоскость через середины
 * двух рёбер, выходящих из вершины B, параллельно третьему ребру BB₁.
 */
export function cubeCutPrism(alt: string): Model {
  const body = box(CUBE, CUBE, CUBE);
  const m = midEdge(body, 'A', 'B');
  const n = midEdge(body, 'B', 'C');
  const cut = { points: [m, n, lift(n, CUBE), lift(m, CUBE)] };
  return prismModel(alt, unlabelled(body), { sections: [cut] });
}
