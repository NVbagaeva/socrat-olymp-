/**
 * Раздел VI «Шар»: прототип P03-92 — площадь поверхности шара по
 * площади его сечения через центр. В задачнике его нет: задача
 * появилась в открытом банке ФИПИ (FcFB97), см. docs/stereometry-plan.md,
 * п. 2.4.
 *
 * Сечение через центр — большой круг радиуса R, поверхность шара —
 * четыре таких круга. Проверка не повторяет ни πR², ни 4πR²: обе
 * площади считаются численным интегрированием — круг полосками,
 * сфера поясами, — и ответ — их отношение, умноженное на S.
 */

import { type Model } from '../../solid/model';
import { ru } from '../format';
import { chisla, chislo, tex, vopros } from '../podskazka';
import { type HintStep, type Params, type Prototype, type Variant, num } from '../types';

function variant(n: number, source: Variant['source'], ref: string, params: Params): Variant {
  return { n, source, ref, params };
}

/** Интеграл по Симпсону: гладкие подынтегральные, 2000 отрезков хватает с запасом. */
function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) {
    s += f(a + i * h) * (i % 2 === 1 ? 4 : 2);
  }
  return (s * h) / 3;
}

/** Площадь круга радиуса 1: полоски x = sin t, ширина 2cos t, dx = cos t dt. */
function krugEdinichnyy(): number {
  return simpson((t) => 2 * Math.cos(t) * Math.cos(t), -Math.PI / 2, Math.PI / 2);
}

/** Площадь сферы радиуса 1: пояса шириной dθ и длиной 2π·sin θ. */
function sferaEdinichnaya(): number {
  return simpson((t) => 2 * Math.PI * Math.sin(t), 0, Math.PI);
}

function chertezh(): Model {
  return {
    alt: 'Шар и его сечение плоскостью через центр — большой круг',
    bodies: [{ kind: 'sphere', center: [0, 0, 0], r: 2.4, equator: false, sections: [0] }],
    marks: [{ p: [0, 0, 0] }],
  };
}

/* ── P03-92. Сечение через центр → площадь поверхности шара ──────── */

export const P03_92: Prototype = {
  id: 'P03-92',
  razdel: 'VI',
  nazvanie: 'Сечение шара через центр → площадь поверхности',
  tip: 'площадь поверхности шара по площади его сечения через центр',
  zadachnik: [0, 0],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Площадь сечения шара плоскостью, проходящей через центр шара, равна ${ru(num(p, 'S'))}. ` +
    'Найдите площадь поверхности шара.',

  dopustimo: (p) => num(p, 'S') > 0,

  otvet: (p) => 4 * num(p, 'S'),

  poModeli: (p) => (num(p, 'S') * sferaEdinichnaya()) / krugEdinichnyy(),

  chertezh,

  shagi: (p) => {
    const S = num(p, 'S');
    return [
      {
        text: 'Плоскость через центр режет шар по большому кругу: его радиус равен радиусу шара $R$.',
      },
      { text: `Площадь этого круга: $\\pi R^2 = ${ru(S)}$.`, value: S },
      {
        text: `Площадь поверхности шара — четыре таких круга: $4\\pi R^2 = 4 \\cdot ${ru(S)} = ${ru(4 * S)}$.`,
        value: 4 * S,
      },
    ];
  },

  podskazka: (p) => podskazka92(p),
  varianty: [
    variant(1, 'фипи', 'ФИПИ FcFB97', { S: 12 }),
    variant(2, 'новый', 'новый', { S: 3 }),
    variant(3, 'новый', 'новый', { S: 5 }),
    variant(4, 'новый', 'новый', { S: 7 }),
    variant(5, 'новый', 'новый', { S: 9 }),
    variant(6, 'новый', 'новый', { S: 15 }),
    variant(7, 'новый', 'новый', { S: 18 }),
    variant(8, 'новый', 'новый', { S: 20 }),
    variant(9, 'новый', 'новый', { S: 25 }),
    variant(10, 'новый', 'новый', { S: 30 }),
  ],
};

/* ── Подсказки-вопросы ──────────────────────────────────────────── */

function podskazka92(p: Params): HintStep[] {
  const S = num(p, 'S');
  return [
    vopros(
      'Что получается в сечении шара плоскостью через центр?',
      'Круг, радиус которого равен радиусу шара',
      ['Круг вдвое меньшего радиуса', 'Окружность без внутренности', 'Эллипс'],
      'Такой круг называют большим кругом шара.',
    ),
    vopros(
      'Чему равно $\\pi R^2$ в этой задаче?',
      chislo(S),
      chisla([2 * S, S / 2, S * S], S, 4 * S),
      'Это и есть площадь сечения из условия.',
    ),
    vopros(
      'Как найти площадь поверхности шара?',
      `$4 \\cdot ${tex(S)}$`,
      [`$2 \\cdot ${tex(S)}$`, `$\\frac{4}{3} \\cdot ${tex(S)}$`, `$${tex(S)}^2$`],
      'Поверхность шара $4\\pi R^2$ — четыре площади большого круга.',
    ),
  ];
}
