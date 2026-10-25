/**
 * Раздел V для «Вариантов повышенной сложности»: прототип той же
 * формы, что P03-69 (два цилиндра), но наоборот: у второго цилиндра
 * высота БОЛЬШЕ, а радиус МЕНЬШЕ. Подвох — радиус уменьшается в
 * квадрате, высота — в первой степени. В список прототипов раздела
 * не входит — его берёт только раздел вариантов.
 *
 * Проверка — как у P03-69: объёмы настоящих 48-угольных призм,
 * погрешность приближения сокращается в отношении.
 */

import { type Model } from '../../solid/model';
import { volumeUnits } from './common';
import { razaWord, ru } from '../format';
import { type Prototype, num } from '../types';

const R = 2.2;
const H = 4.4;

/** Два цилиндра: второй выше и уже первого. */
function dvaCilindraVyshe(alt: string): Model {
  const r2 = R * 0.55;
  return {
    alt,
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h: H },
      { kind: 'cylinder', base: [R + r2 + 1.2, 0, 0], r: r2, h: H * 1.45 },
    ],
  };
}

/* ── P03-69S. Два цилиндра: второй выше, радиус меньше ──────────── */

export const P03_69S: Prototype = {
  id: 'P03-69S',
  razdel: 'V',
  nazvanie: 'Два цилиндра: у второго высота больше, радиус меньше — объём второго',
  tip: 'объём второго цилиндра, когда высота растёт, а радиус уменьшается',
  zadachnik: [234, 237],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) =>
    `Объём одного цилиндра равен ${ru(num(p, 'V'))}. Второй цилиндр в ${ru(num(p, 'a'))} ` +
    `${razaWord(num(p, 'a'))} выше первого, а радиус его основания в ${ru(num(p, 'b'))} ` +
    `${razaWord(num(p, 'b'))} меньше. Найдите объём второго цилиндра.`,

  dopustimo: (p) => num(p, 'V') > 0 && num(p, 'a') > 1 && num(p, 'b') > 1,

  otvet: (p) => (num(p, 'V') * num(p, 'a')) / (num(p, 'b') * num(p, 'b')),

  poModeli: (p) => {
    const scale = num(p, 'V') / volumeUnits(1, 1);
    return scale * volumeUnits(1 / num(p, 'b'), num(p, 'a'));
  },

  chertezh: () =>
    dvaCilindraVyshe('Два цилиндра: второй выше первого, а радиус его основания меньше'),

  shagi: (p) => {
    const V = num(p, 'V');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const otv = (V * a) / (b * b);
    return [
      {
        text: `Объём цилиндра $V = \\pi r^2 h$. Радиус уменьшился в ${ru(b)} ${razaWord(b)} — площадь основания уменьшилась в $${ru(b)}^2 = ${ru(b * b)}$ ${razaWord(b * b)}.`,
        value: b * b,
      },
      {
        text: `Высота выросла в ${ru(a)} ${razaWord(a)}: объём второго $${ru(V)} \\cdot ${ru(a)} : ${ru(b * b)} = ${ru(otv)}$.`,
        value: otv,
      },
    ];
  },

  varianty: [],
};
