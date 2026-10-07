/**
 * Склонения и числа словами для условий задания №11.
 *
 * «1 час / 2 часа / 5 часов», «1 час 20 минут», «Четыре одинаковые
 * рубашки», «семь таких же рубашек». Правило выбора формы — общее
 * для сайта (`lib/plural.ts`); здесь словарь слов задачи.
 */

import { plural } from '../plural';
import { txt } from './num';

/** Формы слова: один, два, пять. */
export type Formy = readonly [string, string, string];

export const SLOVA = {
  chas: ['час', 'часа', 'часов'],
  minuta: ['минута', 'минуты', 'минут'],
  minutu: ['минуту', 'минуты', 'минут'],
  sekunda: ['секунда', 'секунды', 'секунд'],
  sekundu: ['секунду', 'секунды', 'секунд'],
  den: ['день', 'дня', 'дней'],
  detal: ['деталь', 'детали', 'деталей'],
  litr: ['литр', 'литра', 'литров'],
  kg: ['килограмм', 'килограмма', 'килограммов'],
  metr: ['метр', 'метра', 'метров'],
  metram: ['метру', 'метрам', 'метрам'],
  sekundam: ['секунде', 'секундам', 'секундам'],
  minutam: ['минуте', 'минутам', 'минутам'],
  zadacha: ['задача', 'задачи', 'задач'],
  /** Винительный падеж: «решил 1 задачу». */
  zadachu: ['задачу', 'задачи', 'задач'],
  rubl: ['рубль', 'рубля', 'рублей'],
  krug: ['круг', 'круга', 'кругов'],
  shtuka: ['штука', 'штуки', 'штук'],
} as const satisfies Record<string, Formy>;

/** Число со словом: «2 часа», «1,5 часа». Дробное число — форма «двух». */
export function sk(n: number, formy: Formy): string {
  if (!Number.isInteger(n)) {
    return `${txt(n)} ${formy[1]}`;
  }
  return `${txt(n)} ${plural(n, formy[0], formy[1], formy[2])}`;
}

/** Только слово под число: «часа» для 2. */
export function slovo(n: number, formy: Formy): string {
  return Number.isInteger(n) ? plural(n, formy[0], formy[1], formy[2]) : formy[1];
}

/**
 * Время в минутах текстом: 90 → «1 час 30 минут», 50 → «50 минут»,
 * 120 → «2 часа». `vin` — винительный падеж («через 1 минуту»).
 */
export function vremya(minutes: number, vin = false): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  const parts: string[] = [];
  if (h > 0) {
    parts.push(sk(h, SLOVA.chas));
  }
  if (m > 0 || h === 0) {
    parts.push(sk(m, vin ? SLOVA.minutu : SLOVA.minuta));
  }
  return parts.join(' ');
}

/** Часы по циферблату: 7.5 → «07:30», 22 → «22:00». */
export function chasy(hours: number, lead = true): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const hh = lead ? String(h).padStart(2, '0') : String(h);
  return `${hh}:${String(m).padStart(2, '0')}`;
}

const ODIN_DVADTSAT = [
  'ноль',
  'один',
  'два',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
  'двадцать',
] as const;

/** Количественное числительное 0…20 в именительном падеже. */
export function chislo(n: number): string {
  const word = ODIN_DVADTSAT[n];
  if (word === undefined) {
    throw new Error(`нет числительного для ${n}`);
  }
  return word;
}

/** С заглавной буквы. */
export function zaglavnaya(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * «Четыре одинаковые рубашки», «Шесть одинаковых рубашек»: при 2–4
 * прилагательное в именительном падеже множественного числа, при 5+
 * — в родительном. `pril` — пара форм прилагательного [2–4, 5+].
 */
export function shtuk(n: number, pril: readonly [string, string], sush: Formy): string {
  const few = plural(n, 'one', 'few', 'many');
  const adj = few === 'few' ? pril[0] : pril[1];
  const noun = plural(n, sush[0], sush[1], sush[2]);
  const num = n === 2 ? 'две' : chislo(n);
  return `${num} ${adj} ${noun}`;
}
