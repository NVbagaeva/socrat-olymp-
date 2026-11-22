/**
 * База, задание №15: слова условий — доли и «во столько раз» словами,
 * согласование с числом, запись больших чисел с пробелом («4 000»).
 */

import { slovo, zapis } from '../chisla';

export const RUBL = ['рубль', 'рубля', 'рублей'] as const;
export const KOPEYKA = ['копейку', 'копейки', 'копеек'] as const;
export const CHELOVEK = ['человек', 'человека', 'человек'] as const;
export const GEKTAR = ['гектар', 'гектара', 'гектаров'] as const;
export const GRAMM = ['грамм', 'грамма', 'грамм'] as const;
export const VYPUSKNIK = ['выпускник', 'выпускника', 'выпускников'] as const;

/** «12 рублей», «2 рубля». */
export function sChislom(n: number, formy: readonly [string, string, string]): string {
  return `${n} ${slovo(n, formy)}`;
}

/** Разряды через пробел, как в задачнике: 4000 → «4 000», 125000 → «125 000». */
export function razr(n: number): string {
  if (!Number.isInteger(n) || n < 0) throw new Error(`не натуральное: ${n}`);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* ── Доля словами: «Три восьмых», «Одна двадцать пятая» ───────── */

const CHISLITEL: Record<number, string> = {
  1: 'Одна',
  2: 'Две',
  3: 'Три',
  4: 'Четыре',
  5: 'Пять',
  6: 'Шесть',
  7: 'Семь',
  8: 'Восемь',
  9: 'Девять',
  11: 'Одиннадцать',
  13: 'Тринадцать',
  17: 'Семнадцать',
  19: 'Девятнадцать',
};

/** Знаменатель: [одна …-ая, две …-ых]. */
const ZNAMENATEL: Record<number, readonly [string, string]> = {
  5: ['пятая', 'пятых'],
  8: ['восьмая', 'восьмых'],
  10: ['десятая', 'десятых'],
  16: ['шестнадцатая', 'шестнадцатых'],
  20: ['двадцатая', 'двадцатых'],
  25: ['двадцать пятая', 'двадцать пятых'],
  40: ['сороковая', 'сороковых'],
  50: ['пятидесятая', 'пятидесятых'],
};

/** m/n словами с заглавной: «Три четверти», «Одна сороковая». */
export function dolyaSlovami(m: number, n: number): string {
  const ch = CHISLITEL[m];
  if (ch === undefined) throw new Error(`нет слова для числителя ${m}`);
  if (n === 4) {
    if (m === 1) return 'Четверть';
    return `${ch} ${m < 5 ? 'четверти' : 'четвертей'}`;
  }
  const zn = ZNAMENATEL[n];
  if (zn === undefined) throw new Error(`нет слова для знаменателя ${n}`);
  return `${ch} ${m === 1 ? zn[0] : zn[1]}`;
}

/* ── «Во столько раз» ───────────────────────────────────────── */

const RAZ_SLOVOM: Record<number, string> = {
  8: 'восемь',
  10: 'десять',
  16: 'шестнадцать',
  20: 'двадцать',
  25: 'двадцать пять',
  40: 'сорок',
  50: 'пятьдесят',
  80: 'восемьдесят',
  100: 'сто',
};

/**
 * «в восемь раз», «в 2,5 раза»: k100 — число раз, умноженное на 100.
 * Целое число раз пишется словом, дробное — цифрами.
 */
export function vRaz(k100: number): string {
  if (k100 % 100 === 0) {
    const s = RAZ_SLOVOM[k100 / 100];
    if (s === undefined) throw new Error(`нет слова для «в ${k100 / 100} раз»`);
    return `в ${s} раз`;
  }
  return `в ${zapis(k100, 100)} раза`;
}

const VO_STOLKO: Record<number, string> = {
  2: 'вдвое',
  3: 'втрое',
  4: 'вчетверо',
  5: 'впятеро',
  6: 'вшестеро',
  7: 'всемеро',
  8: 'ввосьмеро',
  9: 'вдевятеро',
  10: 'вдесятеро',
};

/** «впятеро», «в 1,45 раза». */
export function voStolko(k100: number): string {
  if (k100 % 100 === 0) {
    const s = VO_STOLKO[k100 / 100];
    if (s === undefined) throw new Error(`нет слова для «в ${k100 / 100} раз»`);
    return s;
  }
  return `в ${zapis(k100, 100)} раза`;
}
