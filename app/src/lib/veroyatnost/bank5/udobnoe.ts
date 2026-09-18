/**
 * Задание №5, прототипы метода удобного числа: 5.3 разность вложенных
 * событий (100 объектов) и 5.11 формула полной вероятности (10 000
 * объектов). Рисунок — сетка 10×10, искомая группа подсвечена.
 *
 * Хлеб в 5.3 стоит с оговоркой: там события не вложены, а совместны
 * («легче 810» и «тяжелее 790»), и ответ равен p₁ + p₂ − 1. Приём тот
 * же — сто буханок, лишние группы вычитаются, — поэтому прототип один.
 */

import { prototip, type Rng } from '../generator';
import { shagP } from '../bank4/vizual';
import { dec, konechnaya, num, text, type Params, type Prototype, type Step } from '../types';
import { setka } from './vizual5';
import { shtuk, tex, texInt, tochnee, tochno, veroyatnost } from './obshchee';

/* ── 5.3. Разность вложенных событий ─────────────────────────────── */

type Syuzhet = 'test' | 'pribor' | 'avtobus' | 'hleb';

const PREDMETY = ['математике', 'физике', 'химии', 'информатике'];
const PRIBORY = [
  ['сканер', 'он'],
  ['тостер', 'он'],
  ['чайник', 'он'],
  ['фен', 'он'],
  ['принтер', 'он'],
] as const;
const HLEB = [
  [790, 810],
  [785, 815],
  [795, 805],
  [780, 820],
] as const;

function syuzhet(p: Params): Syuzhet {
  const s = text(p, 'syuzhet');
  if (s === 'test' || s === 'pribor' || s === 'avtobus' || s === 'hleb') {
    return s;
  }
  throw new Error(`Неизвестный сюжет ${s}`);
}

/** Ответ 5.3: разность вложенных, у хлеба — сумма совместных минус единица. */
function otvet03(p: Params): number {
  const p1 = veroyatnost(p, 'p1');
  const p2 = veroyatnost(p, 'p2');
  return tochnee(syuzhet(p) === 'hleb' ? p1 + p2 - 1 : p1 - p2);
}

/** Группы из 100 объектов: подписи и доли, искомая — вторая. */
function gruppy03(p: Params): { label: string; share: number }[] {
  const p1 = veroyatnost(p, 'p1');
  const p2 = veroyatnost(p, 'p2');
  const otv = otvet03(p);
  switch (syuzhet(p)) {
    case 'test': {
      const k = num(p, 'k');
      return [
        { label: `больше ${k} задач`, share: p2 },
        { label: `ровно ${k}`, share: otv },
        { label: `${k - 1} и меньше`, share: tochnee(1 - p1) },
      ];
    }
    case 'pribor':
      return [
        { label: 'больше двух лет', share: p2 },
        { label: 'от года до двух', share: otv },
        { label: 'меньше года', share: tochnee(1 - p1) },
      ];
    case 'avtobus': {
      const a = num(p, 'a');
      const b = num(p, 'b');
      return [
        { label: `меньше ${a}`, share: p2 },
        { label: `от ${a} до ${b - 1}`, share: otv },
        { label: `${b} и больше`, share: tochnee(1 - p1) },
      ];
    }
    case 'hleb': {
      const a = num(p, 'a');
      const b = num(p, 'b');
      return [
        { label: `легче ${a} г`, share: tochnee(1 - p2) },
        { label: `от ${a} до ${b} г`, share: otv },
        { label: `тяжелее ${b} г`, share: tochnee(1 - p1) },
      ];
    }
    default:
      return [];
  }
}

const P03: Prototype = prototip({
  id: 'p5-03',
  blok: 'vlozhennye',
  nazvanie: 'Вложенные события: «между» через 100 объектов',
  tip: 'Разность вложенных событий',
  zadachnik: [9, 20],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const p1 = dec(veroyatnost(p, 'p1'));
    const p2 = dec(veroyatnost(p, 'p2'));
    switch (syuzhet(p)) {
      case 'test': {
        const k = num(p, 'k');
        return `Вероятность того, что на тестировании по ${text(p, 'predmet')} учащийся А. верно решит больше ${k} задач, равна ${p2}. Вероятность того, что А. верно решит больше ${k - 1} задач, равна ${p1}. Найдите вероятность того, что А. верно решит ровно ${k} задач.`;
      }
      case 'pribor':
        return `Вероятность того, что новый ${text(p, 'pribor')} прослужит больше года, равна ${p1}. Вероятность того, что он прослужит больше двух лет, равна ${p2}. Найдите вероятность того, что он прослужит меньше двух лет, но больше года.`;
      case 'avtobus': {
        const a = num(p, 'a');
        const b = num(p, 'b');
        return `Из районного центра в деревню ежедневно ходит автобус. Вероятность того, что в понедельник в автобусе окажется меньше ${b} пассажиров, равна ${p1}. Вероятность того, что окажется меньше ${a} пассажиров, равна ${p2}. Найдите вероятность того, что число пассажиров будет от ${a} до ${b - 1} включительно.`;
      }
      case 'hleb': {
        const a = num(p, 'a');
        const b = num(p, 'b');
        return `При выпечке хлеба производится контрольное взвешивание свежей буханки. Известно, что вероятность того, что масса окажется меньше ${b} г, равна ${p1}. Вероятность того, что масса окажется больше ${a} г, равна ${p2}. Найдите вероятность того, что масса буханки больше ${a} г, но меньше ${b} г.`;
      }
      default:
        return '';
    }
  },
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const s = syuzhet(p);
    /* Сто объектов: обе вероятности — целые проценты. */
    if (Math.round(p1 * 100) !== p1 * 100 || Math.round(p2 * 100) !== p2 * 100) {
      return false;
    }
    if (p1 <= 0 || p1 >= 1 || p2 <= 0 || p2 >= 1) {
      return false;
    }
    const otv = otvet03(p);
    if (otv <= 0 || otv >= 1 || !konechnaya(otv)) {
      return false;
    }
    if (s === 'hleb') {
      return num(p, 'a') < num(p, 'b') && gruppy03(p).every((g) => g.share > 0);
    }
    if (s === 'avtobus' && !(num(p, 'a') >= 2 && num(p, 'a') < num(p, 'b'))) {
      return false;
    }
    if (s === 'test' && !(num(p, 'k') >= 2)) {
      return false;
    }
    return p1 > p2 && gruppy03(p).every((g) => g.share > 0);
  },
  otvet: otvet03,
  /* Второй путь: считаем штуками из ста — целыми числами. */
  perebor: (p) => {
    const a = shtuk(veroyatnost(p, 'p1'), 100);
    const b = shtuk(veroyatnost(p, 'p2'), 100);
    if (syuzhet(p) === 'hleb') {
      return (100 - (100 - a) - (100 - b)) / 100;
    }
    return (a - b) / 100;
  },
  shagi: (p): Step[] => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const a = shtuk(p1, 100);
    const b = shtuk(p2, 100);
    const m = shtuk(otvet03(p), 100);
    switch (syuzhet(p)) {
      case 'test': {
        const k = num(p, 'k');
        return [
          {
            text: `Возьмём 100 попыток. Больше ${k - 1} задач решается в ${a} из них, больше ${k} — в ${b}:`,
            formula: `100 \\cdot ${tex(p1)} = ${a},\\quad 100 \\cdot ${tex(p2)} = ${b}`,
          },
          {
            text: `Ровно ${k} задач — это «больше ${k - 1}», но не «больше ${k}»:`,
            formula: `m = ${a} - ${b} = ${m}`,
            value: m,
          },
          shagP(m, 100),
        ];
      }
      case 'pribor':
        return [
          {
            text: `Возьмём 100 приборов. Больше года служат ${a} из них, больше двух лет — ${b}:`,
            formula: `100 \\cdot ${tex(p1)} = ${a},\\quad 100 \\cdot ${tex(p2)} = ${b}`,
          },
          {
            text: 'От года до двух — это «больше года», но не «больше двух лет»:',
            formula: `m = ${a} - ${b} = ${m}`,
            value: m,
          },
          shagP(m, 100),
        ];
      case 'avtobus': {
        const aa = num(p, 'a');
        const bb = num(p, 'b');
        return [
          {
            text: `Возьмём 100 понедельников. Меньше ${bb} пассажиров бывает в ${a} из них, меньше ${aa} — в ${b}:`,
            formula: `100 \\cdot ${tex(p1)} = ${a},\\quad 100 \\cdot ${tex(p2)} = ${b}`,
          },
          {
            text: `От ${aa} до ${bb - 1} — это «меньше ${bb}», но не «меньше ${aa}»:`,
            formula: `m = ${a} - ${b} = ${m}`,
            value: m,
          },
          shagP(m, 100),
        ];
      }
      case 'hleb': {
        const aa = num(p, 'a');
        const bb = num(p, 'b');
        return [
          {
            text: `Возьмём 100 буханок. Легче ${bb} г — ${a} из них, тяжелее ${aa} г — ${b}:`,
            formula: `100 \\cdot ${tex(p1)} = ${a},\\quad 100 \\cdot ${tex(p2)} = ${b}`,
          },
          {
            text: `Тяжелее ${bb} г: 100 − ${a} = ${100 - a}; легче ${aa} г: 100 − ${b} = ${100 - b}. Между ${aa} и ${bb} г — все остальные:`,
            formula: `m = 100 - ${100 - a} - ${100 - b} = ${m}`,
            value: m,
          },
          shagP(m, 100),
        ];
      }
      default:
        return [];
    }
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 9',
      params: { syuzhet: 'test', predmet: 'математике', k: 9, p1: 0.75, p2: 0.63 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 10',
      params: { syuzhet: 'test', predmet: 'физике', k: 6, p1: 0.83, p2: 0.77 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 11',
      params: { syuzhet: 'test', predmet: 'математике', k: 11, p1: 0.76, p2: 0.66 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 12',
      params: { syuzhet: 'test', predmet: 'физике', k: 6, p1: 0.66, p2: 0.61 },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 05, № 13',
      params: { syuzhet: 'pribor', pribor: 'сканер', p1: 0.94, p2: 0.87 },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 05, № 14',
      params: { syuzhet: 'pribor', pribor: 'тостер', p1: 0.93, p2: 0.82 },
    },
    {
      n: 7,
      source: 'задачник',
      ref: 'задачник 05, № 15',
      params: { syuzhet: 'avtobus', a: 14, b: 23, p1: 0.87, p2: 0.61 },
    },
    {
      n: 8,
      source: 'задачник',
      ref: 'задачник 05, № 16',
      params: { syuzhet: 'avtobus', a: 11, b: 20, p1: 0.79, p2: 0.61 },
    },
    {
      n: 9,
      source: 'задачник',
      ref: 'задачник 05, № 17',
      params: { syuzhet: 'hleb', a: 790, b: 810, p1: 0.96, p2: 0.82 },
    },
    {
      n: 10,
      source: 'задачник',
      ref: 'задачник 05, № 18',
      params: { syuzhet: 'hleb', a: 790, b: 810, p1: 0.98, p2: 0.83 },
    },
    {
      n: 11,
      source: 'задачник',
      ref: 'задачник 05, № 19',
      params: { syuzhet: 'hleb', a: 785, b: 815, p1: 0.98, p2: 0.86 },
    },
    {
      n: 12,
      source: 'задачник',
      ref: 'задачник 05, № 20',
      params: { syuzhet: 'hleb', a: 795, b: 805, p1: 0.95, p2: 0.81 },
    },
  ],
  generator: (r: Rng): Params => {
    const s = r.pick<Syuzhet>(['test', 'pribor', 'avtobus', 'hleb']);
    switch (s) {
      case 'test': {
        const p2 = r.dec(0.55, 0.85, 2);
        return {
          syuzhet: s,
          predmet: r.pick(PREDMETY),
          k: r.int(5, 12),
          p1: tochnee(p2 + r.dec(0.03, 0.15, 2)),
          p2,
        };
      }
      case 'pribor': {
        const p1 = r.dec(0.85, 0.98, 2);
        return {
          syuzhet: s,
          pribor: r.pick(PRIBORY)[0],
          p1,
          p2: tochnee(p1 - r.dec(0.03, 0.15, 2)),
        };
      }
      case 'avtobus': {
        const a = r.int(8, 16);
        const p1 = r.dec(0.7, 0.92, 2);
        return { syuzhet: s, a, b: a + r.int(5, 12), p1, p2: tochnee(p1 - r.dec(0.1, 0.35, 2)) };
      }
      default: {
        const [a, b] = r.pick(HLEB);
        return { syuzhet: s, a, b, p1: r.dec(0.9, 0.98, 2), p2: r.dec(0.78, 0.92, 2) };
      }
    }
  },
  metodika: {
    metod: 'convenient-number',
    methodHints: [
      'две вероятности событий, одно из которых включает другое',
      'спрашивают про «между»: ровно k, от года до двух, от a до b',
      'проценты удобно превратить в 100 объектов и вычитать группы',
    ],
    fraza: (p) =>
      syuzhet(p) === 'hleb'
        ? 'удобное число — 100 буханок: вычитаем слишком лёгкие и слишком тяжёлые, остаётся искомая группа.'
        : 'удобное число — 100 объектов: событие «между» получается вычитанием одной группы из другой.',
    vizual: (p) => setka(100, gruppy03(p), [1]),
  },
});

/* ── 5.11. Формула полной вероятности: батарейки ─────────────────── */

const BAZA = 10000;

function zabrakovano(p: Params): { neispr: number; ispr: number; z1: number; z2: number } {
  const q = veroyatnost(p, 'p');
  const q1 = veroyatnost(p, 'q1');
  const q2 = veroyatnost(p, 'q2');
  const neispr = shtuk(q, BAZA);
  const ispr = BAZA - neispr;
  return { neispr, ispr, z1: Math.round(neispr * q1), z2: Math.round(ispr * q2) };
}

const P11: Prototype = prototip({
  id: 'p5-11',
  blok: 'polnaya',
  nazvanie: 'Батарейки: система контроля забракует',
  tip: 'Формула полной вероятности',
  zadachnik: [49, 54],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Автоматическая линия изготавливает батарейки. Вероятность того, что готовая батарейка неисправна, равна ${dec(veroyatnost(p, 'p'))}. Перед упаковкой каждая батарейка проходит систему контроля качества. Вероятность того, что система забракует неисправную батарейку, равна ${dec(veroyatnost(p, 'q1'))}. Вероятность того, что система по ошибке забракует исправную батарейку, равна ${dec(veroyatnost(p, 'q2'))}. Найдите вероятность того, что случайно выбранная изготовленная батарейка будет забракована системой контроля.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    const q1 = veroyatnost(p, 'q1');
    const q2 = veroyatnost(p, 'q2');
    if (!(q > 0 && q < 0.5 && q1 > 0.5 && q1 <= 1 && q2 >= 0 && q2 < 0.5)) {
      return false;
    }
    /* Десять тысяч батареек: каждая группа — целое число. */
    const { neispr, ispr, z1, z2 } = zabrakovano(p);
    const tselye =
      Math.abs(neispr - q * BAZA) < 1e-9 &&
      Math.abs(z1 - neispr * q1) < 1e-9 &&
      Math.abs(z2 - ispr * q2) < 1e-9;
    const otv = tochnee(q * q1 + (1 - q) * q2);
    return tselye && otv > 0 && otv < 1 && konechnaya(otv);
  },
  otvet: (p) => {
    const q = veroyatnost(p, 'p');
    return tochnee(q * veroyatnost(p, 'q1') + (1 - q) * veroyatnost(p, 'q2'));
  },
  /* Второй путь: штуками из десяти тысяч. */
  perebor: (p) => {
    const { z1, z2 } = zabrakovano(p);
    return (z1 + z2) / BAZA;
  },
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const q1 = veroyatnost(p, 'q1');
    const q2 = veroyatnost(p, 'q2');
    const { neispr, ispr, z1, z2 } = zabrakovano(p);
    return [
      {
        text: `Возьмём ${texInt(BAZA).replace('\\,', ' ')} батареек. Неисправных ${dec(q * 100)} %, исправных — остальные:`,
        formula: `${texInt(BAZA)} \\cdot ${tex(q)} = ${texInt(neispr)},\\quad ${texInt(BAZA)} - ${texInt(neispr)} = ${texInt(ispr)}`,
      },
      {
        text: 'Забракованы две группы: неисправные, которых система поймала, и исправные, которые она забраковала по ошибке:',
        formula: `${texInt(neispr)} \\cdot ${tex(q1)} + ${texInt(ispr)} \\cdot ${tex(q2)} = ${texInt(z1)} + ${texInt(z2)} = ${texInt(z1 + z2)}`,
        value: z1 + z2,
      },
      {
        text: 'Вероятность',
        formula: `P = \\dfrac{m}{n} = \\dfrac{${texInt(z1 + z2)}}{${texInt(BAZA)}} = ${tex((z1 + z2) / BAZA)}`,
        value: (z1 + z2) / BAZA,
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 49', params: { p: 0.01, q1: 0.96, q2: 0.06 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 50', params: { p: 0.01, q1: 0.95, q2: 0.05 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 51', params: { p: 0.02, q1: 0.97, q2: 0.02 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 52', params: { p: 0.02, q1: 0.98, q2: 0.03 } },
    { n: 5, source: 'задачник', ref: 'задачник 05, № 53', params: { p: 0.05, q1: 0.99, q2: 0.01 } },
    { n: 6, source: 'задачник', ref: 'задачник 05, № 54', params: { p: 0.03, q1: 0.91, q2: 0.01 } },
  ],
  generator: (r: Rng): Params => ({
    p: r.dec(0.01, 0.05, 2),
    q1: r.dec(0.9, 0.99, 2),
    q2: r.dec(0.01, 0.1, 2),
  }),
  metodika: {
    metod: 'convenient-number',
    methodHints: [
      'объекты делятся на группы, у каждой своя вероятность события',
      'спрашивают про событие «вообще», без условия о группе',
      'удобно взять 10 000 объектов и сложить штуки из каждой группы',
    ],
    fraza: () =>
      'удобное число — 10 000 батареек: считаем забракованные в каждой группе и складываем; это и есть формула полной вероятности.',
    vizual: (p) => {
      const q = veroyatnost(p, 'p');
      const q1 = veroyatnost(p, 'q1');
      const q2 = veroyatnost(p, 'q2');
      return setka(
        BAZA,
        [
          { label: 'неисправные, забракованы', share: tochnee(q * q1), tone: 'strong' },
          { label: 'исправные, забракованы по ошибке', share: tochnee((1 - q) * q2), tone: 'mid' },
          { label: 'неисправные, пропущены', share: tochnee(q * (1 - q1)), tone: 'soft' },
          { label: 'исправные, прошли контроль', share: tochnee((1 - q) * (1 - q2)), tone: 'soft' },
        ],
        [0, 1],
        'батареек',
      );
    },
  },
});

export const UDOBNOE: readonly Prototype[] = [P03, P11];
