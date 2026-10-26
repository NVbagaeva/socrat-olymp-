/**
 * Раздел II для «Вариантов повышенной сложности»: прототипы той же
 * формы, что прототипы раздела, но с «подвохом» задачи варианта.
 * В список прототипов раздела (тренажёр, банк, «Собрать вариант») не
 * входят — их берёт только раздел вариантов.
 *
 *   P03-20S — как P03-20, но катеты с корнем, боковое ребро равно
 *             гипотенузе, спрашивают полную поверхность;
 *   P03-28S — пирамида, отсечённая от треугольной (и наклонной) призмы
 *             плоскостью через сторону нижнего основания и вершину
 *             верхнего, спрашивают объём оставшейся части.
 *
 * Проверка формулу не повторяет: строится настоящее тело, площади и
 * объёмы меряются по координатам вершин.
 */

import { prism, vertex } from '../../solid/figures';
import { hullVolume, distance, surfaceArea } from '../../solid/measure';
import { type Model } from '../../solid/model';
import { edge, face, prismModel } from '../../solid/drawings/common';
import { legPrismBody } from './common';
import { shapeLeg } from './drawings';
import { ru } from '../format';
import { type Params, type Prototype, num } from '../types';

/** k√q в TeX: «3\sqrt{3}», «\sqrt{2}». */
function kq(k: number, q: number): string {
  return `${k === 1 ? '' : ru(k)}\\sqrt{${q}}`;
}

/** Гипотенуза основания без корня: катеты a√q и b√q → c√q. */
function gipotenuza(p: Params): number {
  return Math.sqrt(num(p, 'a') ** 2 + num(p, 'b') ** 2);
}

/* ── P03-20S. Прямая призма: катеты с корнем, ребро = гипотенуза ── */

export const P03_20S: Prototype = {
  id: 'P03-20S',
  razdel: 'II',
  nazvanie:
    'Прямая призма над прямоугольным треугольником: полная поверхность, ребро равно гипотенузе',
  tip: 'полная поверхность прямой треугольной призмы, катеты с корнем, боковое ребро — гипотенуза',
  zadachnik: [66, 69],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) => {
    const q = num(p, 'q');
    return (
      `В основании прямой призмы лежит прямоугольный треугольник с катетами $${kq(num(p, 'a'), q)}$ ` +
      `и $${kq(num(p, 'b'), q)}$. Боковое ребро призмы равно гипотенузе этого треугольника. ` +
      'Найдите площадь полной поверхности призмы.'
    );
  },

  dopustimo: (p) =>
    num(p, 'a') > 0 &&
    num(p, 'b') > 0 &&
    num(p, 'q') > 1 &&
    Number.isInteger(gipotenuza(p)) &&
    !Number.isInteger(Math.sqrt(num(p, 'q'))),

  otvet: (p) => {
    const [a, b, q] = [num(p, 'a'), num(p, 'b'), num(p, 'q')];
    const c = gipotenuza(p);
    return a * b * q + (a + b + c) * c * q;
  },

  poModeli: (p) => {
    /* Катеты — настоящие длины с корнем; ребро — гипотенуза, измеренная на модели. */
    const s = Math.sqrt(num(p, 'q'));
    const base = legPrismBody(num(p, 'a') * s, num(p, 'b') * s, 1);
    const h = distance(vertex(base, 'B'), vertex(base, 'C'));
    return surfaceArea(legPrismBody(num(p, 'a') * s, num(p, 'b') * s, h));
  },

  chertezh: () =>
    shapeLeg(
      'Прямая треугольная призма, в основании прямоугольный треугольник; боковое ребро равно гипотенузе',
    ),

  shagi: (p) => {
    const [a, b, q] = [num(p, 'a'), num(p, 'b'), num(p, 'q')];
    const c = gipotenuza(p);
    const osn = a * b * q;
    const bok = (a + b + c) * c * q;
    return [
      {
        text:
          `Гипотенуза: $\\sqrt{(${kq(a, q)})^2 + (${kq(b, q)})^2} = \\sqrt{${a * a * q} + ${b * b * q}} = ` +
          `\\sqrt{${c * c * q}} = ${kq(c, q)}$. Боковое ребро тоже равно $${kq(c, q)}$.`,
        value: c * Math.sqrt(q),
      },
      {
        text: `Два основания — два прямоугольных треугольника, вместе это произведение катетов: $${kq(a, q)} \\cdot ${kq(b, q)} = ${a * b} \\cdot ${q} = ${osn}$.`,
        value: osn,
      },
      {
        text:
          `Боковая поверхность прямой призмы — периметр основания на боковое ребро: ` +
          `$(${kq(a, q)} + ${kq(b, q)} + ${kq(c, q)}) \\cdot ${kq(c, q)} = ${a + b + c}\\sqrt{${q}} \\cdot ${kq(c, q)} = ${a + b + c} \\cdot ${c} \\cdot ${q} = ${bok}$.`,
        value: bok,
      },
      {
        text: `Полная поверхность: $${osn} + ${bok} = ${osn + bok}$.`,
        value: osn + bok,
      },
    ];
  },

  varianty: [],
};

/* ── P03-28S. Пирамида, отсечённая от призмы: оставшаяся часть ──── */

/** Наклонная треугольная призма для картинки: верх сдвинут вправо и назад. */
function naklonnaya(): Model {
  const body = prism(
    [
      [0, 0, 0],
      [4.6, 0, 0],
      [1.6, 2.6, 0],
    ],
    [1.5, 0.6, 4],
  );
  return prismModel(
    'Наклонная треугольная призма ABCA₁B₁C₁; плоскость через AB и C₁ отсекает пирамиду C₁ABC',
    body,
    {
      lines: [edge(body, 'A', 'C1'), edge(body, 'B', 'C1')],
      sections: [face(body, 'A', 'B', 'C1')],
    },
  );
}

export const P03_28S: Prototype = {
  id: 'P03-28S',
  razdel: 'II',
  nazvanie: 'Пирамида, отсечённая от треугольной призмы: объём оставшейся части',
  tip: 'объём части призмы, оставшейся после отсечения пирамиды через сторону основания и вершину другого основания',
  zadachnik: [94, 95],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Объём треугольной призмы $ABCA_1B_1C_1$ равен ${ru(num(p, 'V'))}. Плоскость, проходящая через ` +
    'сторону $AB$ нижнего основания и вершину $C_1$ верхнего основания, отсекает от призмы ' +
    'треугольную пирамиду. Найдите объём оставшейся части призмы.',

  dopustimo: (p) => num(p, 'V') > 0,

  otvet: (p) => (2 * num(p, 'V')) / 3,

  poModeli: (p) => {
    /* Наклонная призма с произвольным треугольником в основании, высота — из V. */
    const area = 7.5;
    const h = num(p, 'V') / area;
    const body = prism(
      [
        [0, 0, 0],
        [5, 0, 0],
        [1, 3, 0],
      ],
      [2, 1, h],
    );
    return hullVolume(['A', 'B', 'A1', 'B1', 'C1'].map((n) => vertex(body, n)));
  },

  chertezh: () => naklonnaya(),

  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: 'Отсечённая пирамида $C_1ABC$: её основание — основание призмы $ABC$, а высота — расстояние от $C_1$ до плоскости $ABC$, то есть высота призмы (и у наклонной призмы тоже).',
      },
      {
        text: `Объём пирамиды — треть объёма призмы: $${ru(V)} : 3 = ${ru(V / 3)}$.`,
        value: V / 3,
      },
      {
        text: `Остаётся $${ru(V)} - ${ru(V / 3)} = ${ru((2 * V) / 3)}$ — две трети призмы.`,
        value: (2 * V) / 3,
      },
    ];
  },

  varianty: [],
};
