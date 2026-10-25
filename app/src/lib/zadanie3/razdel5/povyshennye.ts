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
import { twoMugs } from './drawings';
import { razaWord, ru } from '../format';
import { type Prototype, num, text } from '../types';

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

/* ── Две кружки: своя копия P03-70 без чисел банка ─────────────────
   Тот же разбор, что у прототипа раздела (dvacilindra.ts), но без его
   вариантов: импорт прототипа раздела унёс бы их в сборку. */

const HEIGHT_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'вдвое',
  '2.5': 'в два с половиной раза',
  '3': 'втрое',
  '4': 'в четыре раза',
  '4.5': 'в четыре с половиной раза',
};

const WIDTH_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'в два раза',
  '2.5': 'в два с половиной раза',
  '3': 'в три раза',
  '4': 'в четыре раза',
  '5': 'в пять раз',
};

function heightWord(value: number): string {
  const word = HEIGHT_WORDS[String(value)];
  if (word === undefined) {
    throw new Error(`Нет словесной формы для высоты ×${value}`);
  }
  return word;
}

function widthWord(value: number): string {
  const word = WIDTH_WORDS[String(value)];
  if (word === undefined) {
    throw new Error(`Нет словесной формы для ширины ×${value}`);
  }
  return word;
}

export const PV03_KRUZHKI: Prototype = {
  id: 'PV03-kruzhki',
  razdel: 'V',
  nazvanie: 'Две кружки: отношение объёмов',
  tip: 'отношение объёмов двух цилиндрических кружек',
  zadachnik: [0, 0],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) => {
    const h = heightWord(num(p, 'hk'));
    const w = widthWord(num(p, 'wk'));
    const tail = 'Найдите отношение объёма второй кружки к объёму первой.';
    return text(p, 'style') === 'зато'
      ? `Первая цилиндрическая кружка ${h} выше второй, зато вторая ${w} шире. ${tail}`
      : `Первая цилиндрическая кружка ${h} выше второй, а вторая ${w} шире первой. ${tail}`;
  },

  dopustimo: (p) =>
    HEIGHT_WORDS[String(num(p, 'hk'))] !== undefined &&
    WIDTH_WORDS[String(num(p, 'wk'))] !== undefined,

  otvet: (p) => (num(p, 'wk') * num(p, 'wk')) / num(p, 'hk'),

  poModeli: (p) => {
    /* Первая кружка: радиус 1, высота hk. Вторая: радиус wk, высота 1.
       Оба объёма меряются на настоящих призмах. */
    return volumeUnits(num(p, 'wk'), 1) / volumeUnits(1, num(p, 'hk'));
  },

  chertezh: () => twoMugs('Две цилиндрические кружки: первая выше, вторая шире'),

  shagi: (p) => {
    const hk = num(p, 'hk');
    const wk = num(p, 'wk');
    return [
      {
        text: `Вторая кружка шире в ${ru(wk)} ${razaWord(wk)}, значит площадь её дна больше в ${ru(wk * wk)} ${razaWord(wk * wk)}.`,
        value: wk * wk,
      },
      {
        text: `Но она ниже в ${ru(hk)} ${razaWord(hk)}, поэтому отношение объёмов: $${ru(wk * wk)} : ${ru(hk)} = ${ru((wk * wk) / hk)}$.`,
        value: (wk * wk) / hk,
      },
    ];
  },

  varianty: [],
};
