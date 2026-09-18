/**
 * Склонение существительного при числе: «1 задание», «2 задания»,
 * «5 заданий». Правило русского языка, одно на весь проект.
 */

/** Форма слова для числа n: one — 1, few — 2–4, many — остальное. */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n));
  const tens = abs % 100;
  const ones = abs % 10;
  if (tens >= 11 && tens <= 14) {
    return many;
  }
  if (ones === 1) {
    return one;
  }
  if (ones >= 2 && ones <= 4) {
    return few;
  }
  return many;
}

/** Число вместе со словом: «80 заданий». */
export function counted(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`;
}
