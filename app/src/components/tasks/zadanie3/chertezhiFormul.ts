import { baseCenter, box, regularPrism, regularPyramid, vertex } from '@/lib/solid/figures';
import type { Model } from '@/lib/solid/model';
import type { FormulyFigury3 } from '@/content/zadanie3/spravka';

/**
 * Чертежи блока «Что нужно знать»: величины из формул (a, h, r, l…)
 * подписаны на отрезках цветом величин. Числа на них нет — пример с
 * числами стоит рядом с формулой.
 */
export const CHERTEZHI_FORMUL: Record<FormulyFigury3['id'], () => Model> = {
  parallelepiped: () => {
    const b = box(4, 3, 2);
    return {
      alt: 'Прямоугольный параллелепипед с рёбрами a, b, c и диагональю d',
      bodies: [b],
      lines: [
        { a: vertex(b, 'A'), b: vertex(b, 'B'), label: 'a' },
        { a: vertex(b, 'B'), b: vertex(b, 'C'), label: 'b' },
        { a: vertex(b, 'C'), b: vertex(b, 'C1'), label: 'c' },
        { a: vertex(b, 'A'), b: vertex(b, 'C1'), label: 'd' },
      ],
    };
  },
  prizma: () => {
    const b = regularPrism(3, 2, 3);
    return {
      alt: 'Треугольная призма с высотой h',
      bodies: [b],
      lines: [{ a: vertex(b, 'A'), b: vertex(b, 'A1'), label: 'h' }],
    };
  },
  piramida: () => {
    const b = regularPyramid(4, 2.2, 3);
    const o = baseCenter(b, 4);
    return {
      alt: 'Четырёхугольная пирамида с высотой h',
      bodies: [b],
      lines: [{ a: o, b: vertex(b, 'S'), label: 'h' }],
      marks: [{ p: o }],
    };
  },
  cilindr: () => ({
    alt: 'Цилиндр с радиусом r и высотой h',
    bodies: [{ kind: 'cylinder', base: [0, 0, 0], r: 1.5, h: 3 }],
    lines: [
      { a: [0, 0, 0], b: [1.5, 0, 0], label: 'r' },
      { a: [0, 0, 0], b: [0, 0, 3], label: 'h' },
    ],
  }),
  konus: () => ({
    alt: 'Конус с радиусом r, высотой h и образующей l',
    bodies: [{ kind: 'cone', base: [0, 0, 0], r: 1.5, h: 2.2 }],
    lines: [
      { a: [0, 0, 0], b: [1.5, 0, 0], label: 'r' },
      { a: [0, 0, 0], b: [0, 0, 2.2], label: 'h' },
      { a: [1.5, 0, 0], b: [0, 0, 2.2], label: 'l' },
    ],
  }),
  shar: () => ({
    alt: 'Шар радиуса R',
    bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 1.5 }],
    lines: [{ a: [0, 0, 0], b: [1.5, 0, 0], label: 'R' }],
    marks: [{ p: [0, 0, 0] }],
  }),
};

/** Два куба рамки «Подобные тела»: с ребром a и с ребром 2a. */
export function chertezhPodobiya(alt: string): Model {
  const maly = box(1, 1, 1);
  const bolshoy = box(2, 2, 2);
  return {
    alt,
    bodies: [
      { ...maly, names: [] },
      {
        ...bolshoy,
        names: [],
        vertices: bolshoy.vertices.map(([x, y, z]) => [x + 2.2, y, z]),
      },
    ],
    lines: [
      { a: [0, 0, 0], b: [1, 0, 0], label: 'a' },
      { a: [2.2, 0, 0], b: [4.2, 0, 0], label: '2a' },
    ],
  };
}
