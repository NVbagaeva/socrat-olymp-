/**
 * Раздел II, прототипы P03-20/21: прямая призма над прямоугольным
 * треугольником.
 */

import { polyhedronVolume } from '../../solid/measure';
import { shapeLeg } from './drawings';
import { ru } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';
import { legPrismBody } from './common';

function variant(
  n: number,
  source: Variant['source'],
  ref: string,
  params: Params,
  sourceAnswer?: number,
): Variant {
  return sourceAnswer === undefined
    ? { n, source, ref, params }
    : { n, source, ref, params, sourceAnswer };
}

function legs(p: Params): [number, number] {
  return [num(p, 'a'), num(p, 'b')];
}

/* ── P03-20. Объём прямой треугольной призмы ────────────────────── */

export const P03_20: Prototype = {
  id: 'P03-20',
  razdel: 'II',
  nazvanie: 'Объём прямой треугольной призмы',
  tip: 'объём призмы по катетам основания и боковому ребру',
  zadachnik: [66, 69],
  status: 'есть',
  format: 'целое',

  uslovie: (p) => {
    const [a, b] = legs(p);
    return (
      `Основанием прямой треугольной призмы является прямоугольный треугольник с катетами ${ru(a)} ` +
      `и ${ru(b)}, боковое ребро призмы равно ${ru(num(p, 'h'))}. Найдите объём призмы.`
    );
  },

  dopustimo: (p) => {
    const [a, b] = legs(p);
    return a > 0 && b > 0 && num(p, 'h') > 0;
  },

  otvet: (p) => {
    const [a, b] = legs(p);
    return (a * b * num(p, 'h')) / 2;
  },

  poModeli: (p) => {
    const [a, b] = legs(p);
    return polyhedronVolume(legPrismBody(a, b, num(p, 'h')));
  },

  chertezh: () =>
    shapeLeg(
      'Прямая треугольная призма, в основании прямоугольный треугольник; прямой угол отмечен',
    ),

  shagi: (p) => {
    const [a, b] = legs(p);
    const h = num(p, 'h');
    const area = (a * b) / 2;
    return [
      {
        text: `Площадь основания — прямоугольного треугольника: ${ru(a)} · ${ru(b)} : 2 = ${ru(area)}.`,
        value: area,
      },
      {
        text: `Объём прямой призмы: площадь основания на высоту: ${ru(area)} · ${ru(h)} = ${ru(area * h)}.`,
        value: area * h,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 66', { a: 2, b: 7, h: 6 }),
    variant(2, 'задачник', 'задачник 67', { a: 3, b: 4, h: 4 }),
    variant(3, 'задачник', 'задачник 68', { a: 5, b: 2, h: 12 }),
    variant(4, 'задачник', 'задачник 69', { a: 10, b: 7, h: 4 }),
    variant(5, 'домашка', 'домашка 15, вариант 1', { a: 10, b: 9, h: 8 }, 360),
    variant(6, 'домашка', 'домашка 15, вариант 2', { a: 6, b: 4, h: 3 }, 36),
    variant(7, 'домашка', 'домашка 15, вариант 3', { a: 10, b: 6, h: 8 }, 240),
    variant(8, 'домашка', 'домашка 15, вариант 4', { a: 4, b: 2, h: 10 }, 40),
    variant(9, 'новый', 'новый', { a: 6, b: 5, h: 4 }),
    variant(10, 'новый', 'новый', { a: 9, b: 4, h: 3 }),
  ],
};

/* ── P03-21. Боковое ребро призмы по объёму ─────────────────────── */

export const P03_21: Prototype = {
  id: 'P03-21',
  razdel: 'II',
  nazvanie: 'Боковое ребро призмы по объёму',
  tip: 'боковое ребро призмы по катетам основания и объёму',
  zadachnik: [70, 73],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) => {
    const [a, b] = legs(p);
    return (
      `Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами ${ru(a)} ` +
      `и ${ru(b)}, объём призмы равен ${ru(num(p, 'V'))}. Найдите боковое ребро призмы.`
    );
  },

  dopustimo: (p) => {
    const [a, b] = legs(p);
    return a > 0 && b > 0 && num(p, 'V') > 0;
  },

  otvet: (p) => {
    const [a, b] = legs(p);
    return (2 * num(p, 'V')) / (a * b);
  },

  poModeli: (p) => {
    const [a, b] = legs(p);
    const h = (2 * num(p, 'V')) / (a * b);
    return polyhedronVolume(legPrismBody(a, b, h)) / ((a * b) / 2);
  },

  chertezh: () =>
    shapeLeg(
      'Прямая треугольная призма, в основании прямоугольный треугольник; прямой угол отмечен',
    ),

  shagi: (p) => {
    const [a, b] = legs(p);
    const V = num(p, 'V');
    const area = (a * b) / 2;
    const h = V / area;
    return [
      { text: `Площадь основания: ${ru(a)} · ${ru(b)} : 2 = ${ru(area)}.`, value: area },
      {
        text: `Боковое ребро прямой призмы: объём делённый на площадь основания: ${ru(V)} : ${ru(area)} = ${ru(h)}.`,
        value: h,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 70', { a: 4, b: 7, V: 56 }),
    variant(2, 'задачник', 'задачник 71', { a: 5, b: 6, V: 75 }),
    variant(3, 'задачник', 'задачник 72', { a: 8, b: 3, V: 72 }),
    variant(4, 'задачник', 'задачник 73', { a: 7, b: 6, V: 63 }),
    variant(5, 'новый', 'новый', { a: 9, b: 2, V: 54 }),
    variant(6, 'новый', 'новый', { a: 3, b: 8, V: 48 }),
    variant(7, 'новый', 'новый', { a: 6, b: 6, V: 54 }),
    variant(8, 'новый', 'новый', { a: 4, b: 9, V: 54 }),
    variant(9, 'новый', 'новый', { a: 5, b: 4, V: 50 }),
    variant(10, 'новый', 'новый', { a: 7, b: 3, V: 42 }),
  ],
};
