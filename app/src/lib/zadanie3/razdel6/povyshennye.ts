/**
 * Раздел VI для «Вариантов повышенной сложности» (партия 4): площадь
 * поверхности шара по площади большого круга и отношение поверхностей
 * двух шаров по отношению радиусов. В список прототипов раздела не
 * входит — его берёт только раздел вариантов.
 *
 * Проверка формулу 4πR² не повторяет: площадь сферы — численный
 * интеграл по поясам вращения, площадь круга — по многоугольнику.
 */

import { type Model } from '../../solid/model';
import { twoBalls } from './drawings';
import { ru } from '../format';
import { type Prototype, num } from '../types';

/** «в 3 раза», «в 2,25 раза», «в 25 раз». */
function vRaz(k: number): string {
  const d = k % 10;
  const a = !Number.isInteger(k) || (d >= 2 && d <= 4 && Math.floor(k / 10) % 10 !== 1);
  return `в ${ru(k)} раз${a ? 'а' : ''}`;
}

/** Площадь сферы радиуса r: сумма поясов 2π·ρ(z)·dl по меридиану. */
function sferaChislenno(r: number): number {
  const n = 20000;
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    const u0 = (Math.PI * i) / n;
    const u1 = (Math.PI * (i + 1)) / n;
    const rho = r * Math.sin((u0 + u1) / 2);
    const dl = r * (u1 - u0);
    s += 2 * Math.PI * rho * dl;
  }
  return s;
}

/** Площадь круга радиуса r по вписанному 20000-угольнику. */
function krugChislenno(r: number): number {
  const n = 20000;
  return (n / 2) * r * r * Math.sin((2 * Math.PI) / n);
}

/**
 * vid 0: дана площадь большого круга S — найти площадь поверхности шара
 * (подвох: 4S, а не S или 2S). vid 1: радиус первого шара в k раз больше
 * — во сколько раз больше площадь поверхности (подвох: k², а не k или k³).
 */
export const PV03_SHAR_POVERHNOST: Prototype = {
  id: 'PV03-shar-poverhnost',
  razdel: 'VI',
  nazvanie: 'Шар: поверхность по большому кругу или отношение поверхностей двух шаров',
  tip: 'площадь поверхности шара',
  zadachnik: [170, 171],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    num(p, 'vid') === 0
      ? `Сечение шара плоскостью, проходящей через его центр, имеет площадь ${ru(num(p, 'S'))}. Найдите площадь поверхности шара.`
      : `Радиус одного шара ${vRaz(num(p, 'k'))} больше радиуса другого. Во сколько раз площадь поверхности большего шара больше площади поверхности меньшего?`,
  dopustimo: (p) => (num(p, 'vid') === 0 ? num(p, 'S') > 0 : num(p, 'k') > 1),
  otvet: (p) =>
    Math.round((num(p, 'vid') === 0 ? 4 * num(p, 'S') : num(p, 'k') ** 2) * 1e9) / 1e9,
  poModeli: (p) => {
    const q =
      num(p, 'vid') === 0
        ? (sferaChislenno(1) / krugChislenno(1)) * num(p, 'S')
        : sferaChislenno(num(p, 'k')) / sferaChislenno(1);
    return Math.round(q * 1e6) / 1e6;
  },
  chertezh: (p): Model =>
    num(p, 'vid') === 0
      ? {
          alt: 'Шар и его большой круг — сечение через центр',
          bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 2.4 }],
        }
      : twoBalls('Два шара: радиус первого больше', 2.2, 1.3),
  shagi: (p) => {
    if (num(p, 'vid') === 0) {
      const S = num(p, 'S');
      return [
        {
          text: `Сечение через центр — большой круг: его радиус равен радиусу шара $R$, площадь $\\pi R^2=${ru(S)}$.`,
        },
        {
          text: `Площадь поверхности шара $4\\pi R^2$ — ровно четыре таких круга: $4\\cdot ${ru(S)}=${ru(4 * S)}$.`,
          value: 4 * S,
        },
      ];
    }
    const k = num(p, 'k');
    return [
      { text: 'Площадь поверхности шара $4\\pi R^2$ пропорциональна квадрату радиуса.' },
      {
        text: `Радиус больше ${vRaz(k)} — площадь больше в $${ru(k)}^2=${ru(k * k)}$ раза.`,
        value: k * k,
      },
    ];
  },
  varianty: [],
};
