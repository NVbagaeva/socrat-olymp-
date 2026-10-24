/**
 * Максимальные первичные баллы за задания ЕГЭ — один источник для всего
 * сайта: онлайн-вариант, итоги и код результата, проверка учителем,
 * статистика и выгрузка, функции базы (миграция переносит таблицу сюда
 * же, `pnpm test:chast2` сверяет).
 *
 * Часть 1 (1–13) — по 1 баллу; часть 2 (14–20) — по критериям.
 * Поменять вес задания — поменять число здесь.
 */

import type { EgeNo } from '@/lib/variant/types';

/** Номер задания ЕГЭ: часть 1 — 1…13, часть 2 — 14…20. */
export type EgeNo20 = EgeNo | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export const PART2_NUMBERS = [14, 15, 16, 17, 18, 19, 20] as const;
export type Part2No = (typeof PART2_NUMBERS)[number];

export const MAX_BALL: Readonly<Record<EgeNo20, number>> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 1,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  11: 1,
  12: 1,
  13: 1,
  14: 2,
  15: 3,
  16: 2,
  17: 2,
  18: 3,
  19: 4,
  20: 4,
};

/** Баллы первой части — для онлайн-варианта из заданий 1–13. */
export const BALLY: Readonly<Record<EgeNo, number>> = MAX_BALL;

const sum = (ns: readonly number[]) => ns.reduce((s, n) => s + MAX_BALL[n as EgeNo20], 0);

/** Максимум части 1, части 2 и всей работы: 13, 20, 33. */
export const MAX_PART1 = sum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
export const MAX_PART2 = sum(PART2_NUMBERS);
export const MAX_TOTAL = MAX_PART1 + MAX_PART2;
