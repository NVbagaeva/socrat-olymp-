/**
 * Пиктограммы двенадцати блоков опорных задач №3 и декор шапки
 * списка — модели движка lib/solid. Рисуются темой «стекло» без
 * подписей (renderSolid: tema 'ekran', bezPodpisey): характерное
 * тело или элемент блока, оранжевым — то, что блок учит видеть.
 *
 * Блок «Считаю удобно» — про счёт, а не про тело: вида движком у него
 * нет, пиктограмма — готовая картинка в том же стиле (kartinkaBloka).
 */

import { box, dir, polygonStart, pyramid, regularPolygon, regularPrism, tetrahedron, vertex } from '../../solid/figures';
import type { Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { teloStupenki, vershinyStupenki, type Stupenka } from '../stupenka';

const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

function kub(a: number, b: number, c: number) {
  const body = box(a, b, c);
  return { body, v: (n: string) => vertex(body, n) };
}

function piramida4(R: number, h: number) {
  const body = pyramid(regularPolygon(4, R, 0, polygonStart(4)), [0, 0, h]);
  return { body, v: (n: string) => vertex(body, n), O: [0, 0, 0] as Vec3 };
}

const STUPENKA: Stupenka = { W: 6, w: 3, H: 6, h: 3, D: 3 };

const PIKTOGRAMMY: Readonly<Record<string, () => Model>> = {
  /* Читаю чертёж: в кубе — прямоугольный треугольник с отмеченным углом. */
  chitayu: () => {
    const { body, v } = kub(3, 3, 3);
    return {
      alt: 'Куб с прямоугольным треугольником',
      bodies: [body],
      sections: [{ points: [v('A'), v('B'), v('B1')] }],
      angles: [{ at: v('B'), u: dir(v('B'), v('A')), v: dir(v('B'), v('B1')) }],
    };
  },
  /* Пространство → треугольник: диагональ параллелепипеда и рабочий треугольник. */
  treugolnik: () => {
    const { body, v } = kub(2, 2.4, 4);
    return {
      alt: 'Параллелепипед с рабочим треугольником',
      bodies: [body],
      sections: [{ points: [v('A'), v('C'), v('C1')] }],
      lines: [{ a: v('A'), b: v('C') }],
    };
  },
  /* Пирамида: высота и треугольник SOA. */
  piramida: () => {
    const { body, v, O } = piramida4(3, 4.5);
    return {
      alt: 'Пирамида с высотой',
      bodies: [body],
      sections: [{ points: [v('S'), O, v('A')] }],
      lines: [{ a: v('S'), b: O }],
    };
  },
  /* Объём и площадь: куб. */
  obem: () => {
    const { body } = kub(3, 3, 3);
    return { alt: 'Куб', bodies: [body] };
  },
  /* Составные многогранники: объём — ступенька. */
  'sostavnye-obem': () => ({
    alt: 'Составной многогранник',
    view: 'cabinet',
    bodies: [teloStupenki(STUPENKA)],
  }),
  /* Составные многогранники: площадь — выделенная грань ступеньки. */
  'sostavnye-ploshchad': () => {
    const v = vershinyStupenki(STUPENKA);
    const at = (n: string) => v[n] as Vec3;
    return {
      alt: 'Составной многогранник с выделенной гранью',
      view: 'cabinet',
      bodies: [teloStupenki(STUPENKA)],
      sections: [{ points: [at('A2'), at('B2'), at('C2'), at('D2')] }],
    };
  },
  /* Цилиндр, конус, шар: конус с осевым сечением. */
  vrashcheniya: () => ({
    alt: 'Конус с осевым сечением',
    bodies: [{ kind: 'cone', base: [0, 0, 0], r: 2, h: 4 }],
    sections: [{ points: [[-2, 0, 0], [2, 0, 0], [0, 0, 4]] }],
  }),
  /* Во сколько раз: сосуд-конус с жидкостью. */
  'vo-skolko-raz': () => ({
    alt: 'Сосуд в форме конуса с жидкостью',
    bodies: [{ kind: 'cone', base: [0, 0, 4], r: 2.4, h: 4, inverted: true, liquid: 2.2 }],
  }),
  /* Комбинации тел: шар в цилиндре. */
  kombinacii: () => ({
    alt: 'Шар, вписанный в цилиндр',
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: 2, h: 4, glass: true },
      { kind: 'sphere', center: [0, 0, 2], r: 2 },
    ],
  }),
  /* Углы в многогранниках: правильная треугольная призма и сечение. */
  ugly: () => {
    const body = regularPrism(3, 2, 3.5);
    const v = (n: string) => vertex(body, n);
    return {
      alt: 'Треугольная призма с сечением',
      bodies: [body],
      sections: [{ points: [v('A'), v('B'), v('C1')] }],
    };
  },
  /* Части тел: тетраэдр и треугольник по серединам рёбер. */
  chasti: () => {
    const body = tetrahedron(4);
    const v = (n: string) => vertex(body, n);
    return {
      alt: 'Тетраэдр, отсечённый по серединам рёбер',
      bodies: [body],
      sections: [{ points: [mid(v('D'), v('A')), mid(v('D'), v('B')), mid(v('D'), v('C'))] }],
    };
  },
};

/**
 * Пиктограммы-картинки для блоков, у которых вида движком нет: путь в
 * public/ (на странице — через assetUrl, с версией). 192 × 168 px,
 * прозрачный фон — вдвое больше места на карточке.
 */
const KARTINKI: Readonly<Record<string, string>> = {
  schet: '/images/stereo/o3-blok-12-schitayu-udobno.png',
};

export function kartinkaBloka(id: string): string | null {
  return KARTINKI[id] ?? null;
}

/** Пиктограмма блока; null — для блока вида движком нет. */
export function piktogrammaBloka(id: string): Model | null {
  return PIKTOGRAMMY[id]?.() ?? null;
}

/** Декор шапки списка блоков: «стеклянные» пирамида и призма рядом. */
export function dekorBlokov(): Model {
  const p = pyramid(regularPolygon(4, 3, 0, polygonStart(4)), [0, 0, 6.5]);
  const S = vertex(p, 'S');
  const A = vertex(p, 'A');
  const prismaTelo = regularPrism(3, 2.4, 4.4);
  const sdvig: Vec3 = [5.2, 3, 0];
  const prisma = {
    ...prismaTelo,
    vertices: prismaTelo.vertices.map((q): Vec3 => [q[0] + sdvig[0], q[1] + sdvig[1], q[2] + sdvig[2]]),
  };
  return {
    alt: 'Пирамида и призма',
    bodies: [p, prisma],
    sections: [{ points: [S, [0, 0, 0], A] }],
  };
}
