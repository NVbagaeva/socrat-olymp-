/**
 * Раздел V, прототипы P03-63/64: боковая поверхность цилиндра.
 * Она равна 2πrh, то есть π·(диаметр)·(высота), поэтому из данной
 * величины kπ сразу находится произведение диаметра на высоту.
 *
 * Проверка не повторяет 2πrh: она строит настоящую 48-угольную
 * призму, меряет площадь её боковых граней и подбором ищет то
 * число, при котором измеренная поверхность (в долях от поверхности
 * единичного цилиндра) станет равной k/2.
 */

import { lateralUnits, solveBySearch } from './common';
import { cylinderWithHeight } from './drawings';
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

/* ── P03-63. Диаметр по боковой поверхности и высоте ─────────────── */

export const P03_63: Prototype = {
  id: 'P03-63',
  razdel: 'V',
  nazvanie: 'Диаметр по боковой поверхности и высоте',
  tip: 'диаметр основания цилиндра по боковой поверхности и высоте',
  zadachnik: [208, 211],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Площадь боковой поверхности цилиндра равна $${ru(num(p, 'k'))}\\pi$, а высота равна ` +
    `${ru(num(p, 'h'))}. Найдите диаметр основания.`,

  dopustimo: (p) => num(p, 'k') > 0 && num(p, 'h') > 0,

  otvet: (p) => num(p, 'k') / num(p, 'h'),

  poModeli: (p) => {
    const h = num(p, 'h');
    /* Боковая поверхность единичного цилиндра — 2π, поэтому kπ это
       k/2 «единичных» поверхностей. Диаметр ищется подбором. */
    return solveBySearch(num(p, 'k') / 2, (d) => lateralUnits(d / 2, h));
  },

  chertezh: () => cylinderWithHeight('Цилиндр с высотой: даны боковая поверхность и высота'),

  shagi: (p) => {
    const k = num(p, 'k');
    const h = num(p, 'h');
    return [
      {
        text: `Боковая поверхность цилиндра равна π · (диаметр) · (высота), значит π · d · ${ru(h)} = ${ru(k)}π.`,
      },
      { text: `Диаметр: ${ru(k)} : ${ru(h)} = ${ru(k / h)}.`, value: k / h },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 208', { k: 20, h: 4 }),
    variant(2, 'задачник', 'задачник 209', { k: 40, h: 10 }),
    variant(3, 'задачник', 'задачник 210', { k: 30, h: 5 }),
    variant(4, 'задачник', 'задачник 211', { k: 35, h: 7 }),
    variant(5, 'домашка', 'домашка 39, вариант 1', { k: 72, h: 8 }, 9),
    variant(6, 'домашка', 'домашка 39, вариант 2', { k: 90, h: 10 }, 9),
    variant(7, 'новый', 'новый', { k: 48, h: 6 }),
    variant(8, 'новый', 'новый', { k: 60, h: 12 }),
    variant(9, 'новый', 'новый', { k: 18, h: 3 }),
    variant(10, 'новый', 'новый', { k: 44, h: 4 }),
  ],
};

/* ── P03-64. Высота по боковой поверхности и диаметру ────────────── */

export const P03_64: Prototype = {
  id: 'P03-64',
  razdel: 'V',
  nazvanie: 'Высота по боковой поверхности и диаметру',
  tip: 'высота цилиндра по боковой поверхности и диаметру основания',
  zadachnik: [212, 215],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Площадь боковой поверхности цилиндра равна $${ru(num(p, 'k'))}\\pi$, а диаметр основания ` +
    `равен ${ru(num(p, 'd'))}. Найдите высоту цилиндра.`,

  dopustimo: (p) => num(p, 'k') > 0 && num(p, 'd') > 0,

  otvet: (p) => num(p, 'k') / num(p, 'd'),

  poModeli: (p) => {
    const r = num(p, 'd') / 2;
    return solveBySearch(num(p, 'k') / 2, (h) => lateralUnits(r, h));
  },

  chertezh: () =>
    cylinderWithHeight('Цилиндр с высотой: даны боковая поверхность и диаметр основания'),

  shagi: (p) => {
    const k = num(p, 'k');
    const d = num(p, 'd');
    return [
      {
        text: `Боковая поверхность равна π · (диаметр) · (высота), значит π · ${ru(d)} · h = ${ru(k)}π.`,
      },
      { text: `Высота: ${ru(k)} : ${ru(d)} = ${ru(k / d)}.`, value: k / d },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 212', { k: 12, d: 6 }),
    variant(2, 'задачник', 'задачник 213', { k: 24, d: 8 }),
    variant(3, 'задачник', 'задачник 214', { k: 21, d: 3 }),
    variant(4, 'задачник', 'задачник 215', { k: 16, d: 4 }),
    variant(5, 'новый', 'новый', { k: 36, d: 9 }),
    variant(6, 'новый', 'новый', { k: 30, d: 5 }),
    variant(7, 'новый', 'новый', { k: 45, d: 9 }),
    variant(8, 'новый', 'новый', { k: 28, d: 7 }),
    variant(9, 'новый', 'новый', { k: 54, d: 6 }),
    variant(10, 'новый', 'новый', { k: 40, d: 8 }),
  ],
};
