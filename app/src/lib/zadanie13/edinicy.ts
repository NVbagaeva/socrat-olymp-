/**
 * Единицы ответа задания №13 и проверка «число верное, единицы нет».
 *
 * На ЕГЭ ученик пишет только число, а единицы задаёт условие («ответ
 * выразите в рублях»). Типичная ошибка — посчитать в тысячах и не
 * перевести. Такой ответ не засчитывается, но ученик видит отдельное
 * сообщение «Число верное, единицы нет» (решение автора от 23.10.2026).
 *
 * В браузер ответ уходит отпечатком, поэтому вместе с ним
 * запечатываются и «ответы в чужих единицах» — `wrongUnitValues`.
 */

import type { Units } from './types';

export const UNIT_LABEL: Record<Units, string> = {
  rub: 'рублей',
  thous: 'тыс. рублей',
  mln: 'млн рублей',
  percent: '%',
  months: 'месяцев',
  years: 'лет',
  none: '',
};

/** Во сколько рублей одна единица денег. */
const RUB: Partial<Record<Units, number>> = { rub: 1, thous: 1_000, mln: 1_000_000 };

const round = (x: number): number => Math.round(x * 1e6) / 1e6;

/**
 * Тот же ответ в других денежных единицах: что напишет ученик, если
 * забудет перевести. У процентов, месяцев и лет таких вариантов нет.
 */
export function wrongUnitValues(answer: number, units: Units): number[] {
  const own = RUB[units];
  if (own === undefined) return [];
  const rub = answer * own;
  return (Object.keys(RUB) as Units[])
    .filter((u) => u !== units)
    .map((u) => round(rub / (RUB[u] as number)))
    .filter((v) => v !== round(answer) && v >= 0.001 && v <= 1e12);
}

export type Verdict = 'right' | 'units' | 'wrong';

/** Проверка числом (на сборке и в тестах). В браузере — `checkSealed`. */
export function checkValue(input: number | null, answer: number, units: Units): Verdict {
  if (input === null) return 'wrong';
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
  if (same(input, answer)) return 'right';
  return wrongUnitValues(answer, units).some((v) => same(input, v)) ? 'units' : 'wrong';
}

/** Проверка по отпечаткам: основной ответ и ответы в чужих единицах. */
export function checkSealed(
  input: string,
  sealed: { answer: string; wrongUnits: readonly string[] },
  matches: (input: string, sealed: string) => boolean,
): Verdict {
  if (matches(input, sealed.answer)) return 'right';
  return sealed.wrongUnits.some((s) => matches(input, s)) ? 'units' : 'wrong';
}

export const VERDICT_TEXT: Record<Verdict, string> = {
  right: 'Верно!',
  units: 'Число верное, единицы нет',
  wrong: 'Пока неверно',
};
