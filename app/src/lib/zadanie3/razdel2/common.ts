/**
 * Общее для прототипов раздела II (призма).
 *
 * Чертежи раздела не масштабируются под числа варианта — как и в
 * разделе I, картинка показывает только структуру (буквы, выделенные
 * рёбра, сечение), пропорции фиксированы для читаемости. Настоящая,
 * посчитанная по числам варианта геометрия используется отдельно,
 * только для независимой проверки ответа.
 */

import { prism, regularPrism, vertex } from '../../solid/figures';
import { type Polyhedron } from '../../solid/model';
import { type Vec3 } from '../../solid/vec';

/** Правильный n-угольник: сторона a → радиус описанной окружности. */
function circumradius(n: number, side: number): number {
  return side / (2 * Math.sin(Math.PI / n));
}

/** Правильный n-угольник заданной площади → сторона. */
function sideByArea(n: number, area: number): number {
  /* Площадь = (n/4)·a²·ctg(π/n). */
  const cot = 1 / Math.tan(Math.PI / n);
  return Math.sqrt((4 * area) / (n * cot));
}

/** Правильная призма по стороне основания и высоте: настоящая геометрия. */
export function regularPrismByEdge(n: number, edge: number, h: number): Polyhedron {
  return regularPrism(n, circumradius(n, edge), h);
}

/** Правильная призма по площади основания и боковому ребру. */
export function regularPrismByArea(n: number, area: number, h: number): Polyhedron {
  return regularPrism(n, circumradius(n, sideByArea(n, area)), h);
}

/** Площадь правильного n-угольника со стороной a. */
export function regularArea(n: number, side: number): number {
  return ((n / 4) * side * side) / Math.tan(Math.PI / n);
}

/**
 * Прямая призма над прямоугольным треугольником: катеты a (вдоль x),
 * b (вдоль y), прямой угол в вершине 0. Настоящая геометрия для
 * проверки P03-20/21.
 */
export function legPrismBody(a: number, b: number, h: number): Polyhedron {
  return prism(
    [
      [0, 0, 0],
      [a, 0, 0],
      [0, b, 0],
    ],
    [0, 0, h],
  );
}

/** Направление между двумя вершинами настоящей модели по именам. */
export function direction(body: Polyhedron, from: string, to: string): Vec3 {
  const a = vertex(body, from);
  const b = vertex(body, to);
  return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
}

/** Точки настоящей модели по списку имён вершин. */
export function points(body: Polyhedron, names: readonly string[]): Vec3[] {
  return names.map((name) => vertex(body, name));
}
