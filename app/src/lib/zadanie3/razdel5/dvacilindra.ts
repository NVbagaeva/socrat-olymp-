/**
 * Раздел V, прототипы P03-69/70: два цилиндра.
 *
 * Объём цилиндра растёт как квадрат радиуса и как первая степень
 * высоты. Проверка не пользуется формулой πr²h: она меряет настоящие
 * объёмы двух 48-угольных призм и берёт их отношение — погрешность
 * приближения у обоих тел одна и та же и сокращается.
 */

import { volumeUnits } from './common';
import { twoCylinders, twoMugs } from './drawings';
import { razaWord, round, ru, tex } from '../format';
import { type Params, type Prototype, type Variant, num, text } from '../types';

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

/* ── P03-69. Два цилиндра: объём второго ─────────────────────────── */

export const P03_69: Prototype = {
  id: 'P03-69',
  razdel: 'V',
  nazvanie: 'Два цилиндра: объём второго',
  tip: 'объём второго цилиндра по изменению высоты и радиуса',
  zadachnik: [234, 237],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Дано два цилиндра. Объём первого цилиндра равен ${ru(num(p, 'V'))}. У второго цилиндра высота ` +
    `в ${ru(num(p, 'a'))} ${razaWord(num(p, 'a'))} меньше, а радиус основания в ${ru(num(p, 'b'))} ` +
    `${razaWord(num(p, 'b'))} больше, чем у первого. Найдите объём второго цилиндра.`,

  dopustimo: (p) => num(p, 'V') > 0 && num(p, 'a') > 0 && num(p, 'b') > 0,

  otvet: (p) => (num(p, 'V') * num(p, 'b') * num(p, 'b')) / num(p, 'a'),

  poModeli: (p) => {
    /* Сколько условных единиц объёма в единичном цилиндре, столько же
       и во втором — меряем настоящую призму с новым радиусом и высотой. */
    const scale = num(p, 'V') / volumeUnits(1, 1);
    return scale * volumeUnits(num(p, 'b'), 1 / num(p, 'a'));
  },

  chertezh: () => twoCylinders('Два цилиндра: у второго высота меньше, а радиус основания больше'),

  shagi: (p) => {
    const V = num(p, 'V');
    const a = num(p, 'a');
    const b = num(p, 'b');
    return [
      {
        text: `Радиус вырос в ${ru(b)} ${razaWord(b)}, значит площадь основания — в ${ru(b * b)} ${razaWord(b * b)}.`,
        value: b * b,
      },
      {
        text: `Высота уменьшилась в ${ru(a)} ${razaWord(a)}, и объём меняется вместе с ней.`,
        formula: `\\dfrac{${tex(V)} \\cdot ${tex(round(b * b))}}{${tex(a)}} = \\dfrac{${tex(round(V * b * b))}}{${tex(a)}} = ${tex(round((V * b * b) / a))}`,
        value: (V * b * b) / a,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 234', { V: 15, a: 3, b: 2 }),
    variant(2, 'задачник', 'задачник 235', { V: 20, a: 4, b: 3 }),
    variant(3, 'задачник', 'задачник 236', { V: 18, a: 3, b: 3 }),
    variant(4, 'задачник', 'задачник 237', { V: 16, a: 2, b: 2 }),
    variant(5, 'домашка', 'домашка 43, вариант 1', { V: 10, a: 5, b: 2 }, 8),
    variant(6, 'домашка', 'домашка 43, вариант 2', { V: 40, a: 4, b: 3 }, 90),
    variant(7, 'домашка', 'домашка 43, вариант 3', { V: 12, a: 6, b: 5 }, 50),
    variant(8, 'домашка', 'домашка 43, вариант 4', { V: 10, a: 2, b: 3 }, 45),
    variant(9, 'новый', 'новый', { V: 24, a: 3, b: 2 }),
    variant(10, 'новый', 'новый', { V: 18, a: 6, b: 4 }),
  ],
};

/* ── P03-70. Две кружки: отношение объёмов ──────────────────────── */

/**
 * Множители в этом прототипе задачник называет словами, а не числами.
 * Таблица соответствий зафиксирована здесь и согласована отдельно:
 * форма зависит и от значения, и от того, о высоте речь или о ширине.
 * Считать словоформу на лету нельзя — «вдвое выше», но «в два раза
 * шире», это разные слова для одного и того же числа.
 */
const HEIGHT_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'вдвое',
  '3': 'втрое',
  '4': 'в четыре раза',
  '4.5': 'в четыре с половиной раза',
};

const WIDTH_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'в два раза',
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

export const P03_70: Prototype = {
  id: 'P03-70',
  razdel: 'V',
  nazvanie: 'Две кружки: отношение объёмов',
  tip: 'отношение объёмов двух цилиндрических кружек',
  zadachnik: [238, 241],
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
        text: `Но она ниже в ${ru(hk)} ${razaWord(hk)}, и это отношение делит первое.`,
        formula: `\\dfrac{${tex(round(wk * wk))}}{${tex(hk)}} = ${tex(round((wk * wk) / hk))}`,
        value: (wk * wk) / hk,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 238', { hk: 2, wk: 3, style: 'зато' }),
    variant(2, 'задачник', 'задачник 239', { hk: 2, wk: 4, style: 'а' }),
    variant(3, 'задачник', 'задачник 240', { hk: 4.5, wk: 1.5, style: 'а' }),
    variant(4, 'задачник', 'задачник 241', { hk: 1.5, wk: 3, style: 'а' }),
    variant(5, 'домашка', 'домашка 44, вариант 2', { hk: 3, wk: 3, style: 'а' }, 3),
    variant(6, 'домашка', 'домашка 44, вариант 4', { hk: 3, wk: 1.5, style: 'а' }, 0.75),
    variant(7, 'новый', 'новый', { hk: 4, wk: 2, style: 'а' }),
    variant(8, 'новый', 'новый', { hk: 2, wk: 5, style: 'а' }),
    variant(9, 'новый', 'новый', { hk: 4, wk: 3, style: 'а' }),
    variant(10, 'новый', 'новый', { hk: 4.5, wk: 3, style: 'а' }),
  ],
};
