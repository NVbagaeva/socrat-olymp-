/**
 * Раздел IV, прототипы P03-52…54: высота h, радиус r и образующая l
 * конуса связаны как катет, катет и гипотенуза (l² = h² + r²). Три
 * прототипа — три способа задать два из них и найти третье.
 *
 * Независимая проверка не пересчитывает ту же формулу: она строит
 * настоящую вершину и точку на окружности основания в трёх
 * координатах и меряет между ними расстояние — так проверяется,
 * что НАЙДЕННОЕ число и вправду восстанавливает то условие, которое
 * не участвовало в его выводе.
 */

import { apex, basePoint, solveBySearch } from './common';
import { distance } from '../../solid/measure';
import { coneWithHeight } from './drawings';
import { ru } from '../format';
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

/* ── P03-52. Образующая по высоте и диаметру ────────────────────── */

export const P03_52: Prototype = {
  id: 'P03-52',
  razdel: 'IV',
  nazvanie: 'Образующая по высоте и диаметру',
  tip: 'образующая конуса по высоте и диаметру основания',
  zadachnik: [164, 167],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Высота конуса равна ${ru(num(p, 'h'))}, а диаметр основания равен ${ru(num(p, 'd'))}. ` +
    'Найдите длину образующей конуса.',

  dopustimo: (p) => num(p, 'h') > 0 && num(p, 'd') > 0,

  otvet: (p) => {
    const r = num(p, 'd') / 2;
    return Math.hypot(num(p, 'h'), r);
  },

  poModeli: (p) => {
    const r = num(p, 'd') / 2;
    /* Настоящая вершина и точка окружности: расстояние между ними —
       это и есть образующая, посчитанная не по формуле, а измерением. */
    return distance(apex(num(p, 'h')), basePoint(r, 0));
  },

  chertezh: () => coneWithHeight('Конус с высотой: даны высота и диаметр основания'),

  shagi: (p) => {
    const h = num(p, 'h');
    const r = num(p, 'd') / 2;
    const l = Math.hypot(h, r);
    return [
      { text: `Радиус основания: ${ru(num(p, 'd'))} : 2 = ${ru(r)}.`, value: r },
      {
        text: `Образующая — гипотенуза прямоугольного треугольника с катетами высотой и радиусом: √(${ru(h)}² + ${ru(r)}²) = ${ru(l)}.`,
        value: l,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 164', { h: 12, d: 70 }),
    variant(2, 'задачник', 'задачник 165', { h: 16, d: 60 }),
    variant(3, 'задачник', 'задачник 166', { h: 32, d: 48 }),
    variant(4, 'задачник', 'задачник 167', { h: 5, d: 24 }),
    variant(5, 'домашка', 'домашка 33, вариант 1', { h: 21, d: 40 }, 29),
    variant(6, 'домашка', 'домашка 33, вариант 2', { h: 9, d: 80 }, 41),
    variant(7, 'домашка', 'домашка 33, вариант 3', { h: 8, d: 30 }, 17),
    variant(8, 'новый', 'новый', { h: 15, d: 16 }),
    variant(9, 'новый', 'новый', { h: 20, d: 42 }),
    variant(10, 'новый', 'новый', { h: 24, d: 14 }),
  ],
};

/* ── P03-53. Диаметр по высоте и образующей ─────────────────────── */

export const P03_53: Prototype = {
  id: 'P03-53',
  razdel: 'IV',
  nazvanie: 'Диаметр по высоте и образующей',
  tip: 'диаметр основания конуса по высоте и образующей',
  zadachnik: [168, 171],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Высота конуса равна ${ru(num(p, 'h'))}, а длина образующей равна ${ru(num(p, 'l'))}. ` +
    'Найдите диаметр основания конуса.',

  dopustimo: (p) => num(p, 'l') > num(p, 'h') && num(p, 'h') > 0,

  otvet: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    return 2 * Math.sqrt(l * l - h * h);
  },

  poModeli: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    /* Радиус ищется не по формуле √(l²−h²), а подбором: какой радиус
       даёт настоящее расстояние от вершины до окружности, равное l. */
    const r = solveBySearch(l, (x) => distance(apex(h), basePoint(x, 0)));
    return 2 * r;
  },

  chertezh: () => coneWithHeight('Конус с высотой: даны высота и образующая'),

  shagi: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    const r = Math.sqrt(l * l - h * h);
    return [
      {
        text: `Радиус — катет прямоугольного треугольника с гипотенузой образующей: √(${ru(l)}² − ${ru(h)}²) = ${ru(r)}.`,
        value: r,
      },
      { text: `Диаметр: ${ru(r)} · 2 = ${ru(2 * r)}.`, value: 2 * r },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 168', { h: 9, l: 41 }),
    variant(2, 'задачник', 'задачник 169', { h: 21, l: 29 }),
    variant(3, 'задачник', 'задачник 170', { h: 24, l: 30 }),
    variant(4, 'задачник', 'задачник 171', { h: 24, l: 25 }),
    variant(5, 'новый', 'новый', { h: 12, l: 37 }),
    variant(6, 'новый', 'новый', { h: 8, l: 17 }),
    variant(7, 'новый', 'новый', { h: 20, l: 52 }),
    variant(8, 'новый', 'новый', { h: 9, l: 15 }),
    variant(9, 'новый', 'новый', { h: 16, l: 34 }),
    variant(10, 'новый', 'новый', { h: 33, l: 65 }),
  ],
};

/* ── P03-54. Высота по диаметру и образующей ────────────────────── */

export const P03_54: Prototype = {
  id: 'P03-54',
  razdel: 'IV',
  nazvanie: 'Высота по диаметру и образующей',
  tip: 'высота конуса по диаметру основания и образующей',
  zadachnik: [172, 175],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Диаметр основания конуса равен ${ru(num(p, 'd'))}, а длина образующей — ${ru(num(p, 'l'))}. ` +
    'Найдите высоту конуса.',

  dopustimo: (p) => {
    const r = num(p, 'd') / 2;
    return num(p, 'l') > r && r > 0;
  },

  otvet: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    return Math.sqrt(l * l - r * r);
  },

  poModeli: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    /* Высота ищется не по формуле √(l²−r²), а подбором: какая высота
       даёт настоящее расстояние от вершины до окружности, равное l. */
    return solveBySearch(l, (x) => distance(apex(x), basePoint(r, 0)));
  },

  chertezh: () => coneWithHeight('Конус с высотой: даны диаметр основания и образующая'),

  shagi: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    const h = Math.sqrt(l * l - r * r);
    return [
      { text: `Радиус: ${ru(num(p, 'd'))} : 2 = ${ru(r)}.`, value: r },
      { text: `Высота — катет: √(${ru(l)}² − ${ru(r)}²) = ${ru(h)}.`, value: h },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 172', { d: 10, l: 13 }),
    variant(2, 'задачник', 'задачник 173', { d: 14, l: 25 }),
    variant(3, 'задачник', 'задачник 174', { d: 32, l: 65 }),
    variant(4, 'задачник', 'задачник 175', { d: 18, l: 41 }),
    variant(5, 'новый', 'новый', { d: 16, l: 17 }),
    variant(6, 'новый', 'новый', { d: 6, l: 5 }),
    variant(7, 'новый', 'новый', { d: 48, l: 25 }),
    variant(8, 'новый', 'новый', { d: 30, l: 17 }),
    variant(9, 'новый', 'новый', { d: 24, l: 13 }),
    variant(10, 'новый', 'новый', { d: 80, l: 41 }),
  ],
};
