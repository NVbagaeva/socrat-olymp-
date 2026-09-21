/**
 * Раздел VII, прототип P03-76: цилиндр около прямой призмы.
 *
 * Радиус цилиндра — радиус окружности, описанной около основания.
 * У прямоугольного треугольника центр этой окружности лежит на
 * середине гипотенузы, и это здесь не постулируется, а проверяется:
 * центр ищется из условия равных расстояний до трёх вершин, радиус
 * потом измеряется. Объём цилиндра берётся измерением настоящего
 * многогранного приближения, а не формулой πR²h.
 */

import { circumradiusOfLegs, volumeUnits } from './common';
import { cylinderAroundPrism } from './drawings';
import { round, ru, tex } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';

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

export const P03_76: Prototype = {
  id: 'P03-76',
  razdel: 'VII',
  nazvanie: 'Цилиндр около призмы',
  tip: 'объём цилиндра, описанного около прямой призмы с прямоугольным треугольником в основании',
  zadachnik: [262, 265],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В основании прямой призмы лежит прямоугольный треугольник с катетами ${ru(num(p, 'a'))} и ` +
    `${ru(num(p, 'b'))}. Боковые рёбра призмы равны $\\frac{${ru(num(p, 'k'))}}{\\pi}$. ` +
    'Найдите объём цилиндра, описанного около этой призмы.',

  dopustimo: (p) => num(p, 'a') > 0 && num(p, 'b') > 0 && num(p, 'k') > 0,

  otvet: (p) => (num(p, 'k') * (num(p, 'a') ** 2 + num(p, 'b') ** 2)) / 4,

  poModeli: (p) => {
    /* Радиус — измеренное расстояние от найденного центра до вершины. */
    const r = circumradiusOfLegs(num(p, 'a'), num(p, 'b'));
    const h = num(p, 'k') / Math.PI;
    /* Объём единичного цилиндра равен π, а во сколько раз наш
       больше единичного — измерено на настоящих телах. */
    return Math.PI * volumeUnits(r, h);
  },

  chertezh: () =>
    cylinderAroundPrism(
      'Цилиндр, описанный около прямой призмы с прямоугольным треугольником в основании',
    ),

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const k = num(p, 'k');
    const d2 = a * a + b * b;
    return [
      {
        text: 'Центр описанной окружности прямоугольного треугольника — середина гипотенузы, поэтому квадрат радиуса равен четверти квадрата гипотенузы.',
        formula: `\\dfrac{${tex(a)}^2 + ${tex(b)}^2}{4} = \\dfrac{${tex(round(a * a))} + ${tex(round(b * b))}}{4} = \\dfrac{${tex(round(d2))}}{4} = ${tex(round(d2 / 4))}`,
        value: d2 / 4,
      },
      {
        text: `Объём цилиндра — «пи» на квадрат радиуса и на высоту. Высота равна ${ru(k)}, делённому на «пи», поэтому «пи» сокращается.`,
        formula: `${tex(round(d2 / 4))} \\cdot ${tex(k)} = ${tex(round((k * d2) / 4))}`,
        value: (k * d2) / 4,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 262', { a: 10, b: 9, k: 2 }),
    variant(2, 'задачник', 'задачник 263', { a: 1, b: 8, k: 6 }),
    variant(3, 'задачник', 'задачник 264', { a: 20, b: 21, k: 4 }),
    variant(4, 'задачник', 'задачник 265', { a: 7, b: 24, k: 8 }),
    variant(5, 'домашка', 'домашка 48, вариант 1', { a: 3, b: 4, k: 4 }, 25),
    variant(6, 'домашка', 'домашка 48, вариант 2', { a: 10, b: 24, k: 12 }, 2028),
    variant(7, 'домашка', 'домашка 48, вариант 3', { a: 12, b: 16, k: 16 }, 1600),
    variant(8, 'домашка', 'домашка 48, вариант 4', { a: 7, b: 24, k: 6 }, 937.5),
    variant(9, 'новый', 'новый', { a: 5, b: 12, k: 2 }),
    variant(10, 'новый', 'новый', { a: 8, b: 15, k: 4 }),
  ],
};
