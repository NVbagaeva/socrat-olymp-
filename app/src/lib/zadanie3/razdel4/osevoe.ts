/**
 * Раздел IV, прототипы P03-55…57: площадь осевого сечения конуса —
 * равнобедренного треугольника с основанием — диаметром и высотой —
 * высотой конуса.
 *
 * Независимая проверка строит этот треугольник по-настоящему (вершина
 * конуса и две диаметрально противоположные точки окружности
 * основания) и меряет площадь многоугольника по координатам —
 * без формулы «радиус на высоту».
 */

import { apex, basePoint } from './common';
import { polygonArea } from '../../solid/measure';
import { coneWithAxial } from './drawings';
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

function axialArea(r: number, h: number): number {
  return polygonArea([apex(h), basePoint(r, 0), basePoint(r, Math.PI)]);
}

/* ── P03-55. Осевое сечение по диаметру и образующей ────────────── */

export const P03_55: Prototype = {
  id: 'P03-55',
  razdel: 'IV',
  nazvanie: 'Осевое сечение по диаметру и образующей',
  tip: 'площадь осевого сечения по диаметру и образующей',
  zadachnik: [176, 179],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Диаметр основания конуса равен ${ru(num(p, 'd'))}, а длина образующей — ${ru(num(p, 'l'))}. ` +
    'Найдите площадь осевого сечения этого конуса.',

  dopustimo: (p) => num(p, 'l') > num(p, 'd') / 2 && num(p, 'd') > 0,

  otvet: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    const h = Math.sqrt(l * l - r * r);
    return r * h;
  },

  poModeli: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    const h = Math.sqrt(l * l - r * r);
    return axialArea(r, h);
  },

  chertezh: () => coneWithAxial('Конус с осевым сечением и высотой'),

  shagi: (p) => {
    const r = num(p, 'd') / 2;
    const l = num(p, 'l');
    const h = Math.sqrt(l * l - r * r);
    return [
      { text: `Высота: √(${ru(l)}² − ${ru(r)}²) = ${ru(h)}.`, value: h },
      {
        text: `Осевое сечение — треугольник с основанием ${ru(num(p, 'd'))} и высотой ${ru(h)}: площадь = ${ru(num(p, 'd'))} · ${ru(h)} : 2 = ${ru(r * h)}.`,
        value: r * h,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 176', { d: 140, l: 74 }),
    variant(2, 'задачник', 'задачник 177', { d: 90, l: 51 }),
    variant(3, 'задачник', 'задачник 178', { d: 96, l: 50 }),
    variant(4, 'задачник', 'задачник 179', { d: 120, l: 65 }),
    variant(5, 'домашка', 'домашка 34, вариант 1', { d: 14, l: 25 }, 168),
    variant(6, 'домашка', 'домашка 34, вариант 2', { d: 48, l: 40 }, 768),
    variant(7, 'новый', 'новый', { d: 18, l: 15 }),
    variant(8, 'новый', 'новый', { d: 24, l: 13 }),
    variant(9, 'новый', 'новый', { d: 30, l: 17 }),
    variant(10, 'новый', 'новый', { d: 66, l: 65 }),
  ],
};

/* ── P03-56. Осевое сечение по высоте и образующей ───────────────── */

export const P03_56: Prototype = {
  id: 'P03-56',
  razdel: 'IV',
  nazvanie: 'Осевое сечение по высоте и образующей',
  tip: 'площадь осевого сечения по высоте и образующей',
  zadachnik: [180, 183],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Высота конуса равна ${ru(num(p, 'h'))}, а длина образующей — ${ru(num(p, 'l'))}. ` +
    'Найдите площадь осевого сечения этого конуса.',

  dopustimo: (p) => num(p, 'l') > num(p, 'h') && num(p, 'h') > 0,

  otvet: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    const r = Math.sqrt(l * l - h * h);
    return r * h;
  },

  poModeli: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    const r = Math.sqrt(l * l - h * h);
    return axialArea(r, h);
  },

  chertezh: () => coneWithAxial('Конус с осевым сечением и высотой'),

  shagi: (p) => {
    const h = num(p, 'h');
    const l = num(p, 'l');
    const r = Math.sqrt(l * l - h * h);
    return [
      { text: `Радиус: √(${ru(l)}² − ${ru(h)}²) = ${ru(r)}.`, value: r },
      {
        text: `Осевое сечение — треугольник с основанием ${ru(2 * r)} и высотой ${ru(h)}: площадь = ${ru(r)} · ${ru(h)} = ${ru(r * h)}.`,
        value: r * h,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 180', { h: 40, l: 58 }),
    variant(2, 'задачник', 'задачник 181', { h: 20, l: 29 }),
    variant(3, 'задачник', 'задачник 182', { h: 32, l: 68 }),
    variant(4, 'задачник', 'задачник 183', { h: 33, l: 55 }),
    variant(5, 'домашка', 'домашка 34, вариант 3', { h: 9, l: 41 }, 360),
    variant(6, 'домашка', 'домашка 34, вариант 4', { h: 24, l: 30 }, 432),
    variant(7, 'новый', 'новый', { h: 12, l: 37 }),
    variant(8, 'новый', 'новый', { h: 16, l: 20 }),
    variant(9, 'новый', 'новый', { h: 21, l: 29 }),
    variant(10, 'новый', 'новый', { h: 15, l: 17 }),
  ],
};

/* ── P03-57. Осевое сечение по площади основания kπ и высоте ─────── */

export const P03_57: Prototype = {
  id: 'P03-57',
  razdel: 'IV',
  nazvanie: 'Осевое сечение по площади основания kπ и высоте',
  tip: 'площадь осевого сечения по площади основания и высоте',
  zadachnik: [184, 187],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Площадь основания конуса равна $${ru(num(p, 'k'))}\\pi$, высота — ${ru(num(p, 'h'))}. ` +
    'Найдите площадь осевого сечения этого конуса.',

  dopustimo: (p) => num(p, 'k') > 0 && num(p, 'h') > 0,

  otvet: (p) => {
    const r = Math.sqrt(num(p, 'k'));
    return r * num(p, 'h');
  },

  poModeli: (p) => {
    const r = Math.sqrt(num(p, 'k'));
    return axialArea(r, num(p, 'h'));
  },

  chertezh: () => coneWithAxial('Конус с осевым сечением и высотой'),

  shagi: (p) => {
    const k = num(p, 'k');
    const h = num(p, 'h');
    const r = Math.sqrt(k);
    return [
      { text: `Площадь основания πr² = ${ru(k)}π, значит r = √${ru(k)} = ${ru(r)}.`, value: r },
      { text: `Осевое сечение: ${ru(r)} · ${ru(h)} = ${ru(r * h)}.`, value: r * h },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 184', { k: 4, h: 3 }),
    variant(2, 'задачник', 'задачник 185', { k: 36, h: 10 }),
    variant(3, 'задачник', 'задачник 186', { k: 9, h: 6 }),
    variant(4, 'задачник', 'задачник 187', { k: 25, h: 8 }),
    variant(5, 'новый', 'новый', { k: 16, h: 5 }),
    variant(6, 'новый', 'новый', { k: 49, h: 4 }),
    variant(7, 'новый', 'новый', { k: 64, h: 3 }),
    variant(8, 'новый', 'новый', { k: 81, h: 7 }),
    variant(9, 'новый', 'новый', { k: 100, h: 2 }),
    variant(10, 'новый', 'новый', { k: 1, h: 9 }),
  ],
};
