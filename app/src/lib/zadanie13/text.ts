/**
 * Тексты условий задания №13: числа, деньги, проценты и рамки ФИПИ.
 *
 * Рамки — стандартные формулировки открытого банка («1-го числа каждого
 * месяца долг возрастает…»): их не переписываем, меняем только сюжет и
 * числа (docs/13-economics/03-prototypes.md, «Рамки условий»).
 */

import { D, type DrobInput } from './drob';
import type { PlotFull } from './plots';
import { v } from './plots';

const NB = ' ';

/** Число по-русски: «1 200 000», «4,55». */
export const num = (x: DrobInput): string => D(x).toRu();

export const pct = (r: DrobInput): string => `${num(r)}${NB}%`;

/** Деньги: rub — «275 000 рублей», thous — «690 тыс. рублей», mln — «4,55 млн рублей». */
export function money(x: DrobInput, unit: 'rub' | 'thous' | 'mln'): string {
  const word = unit === 'rub' ? 'рублей' : unit === 'thous' ? `тыс.${NB}рублей` : `млн${NB}рублей`;
  return `${num(x)}${NB}${word}`;
}

export const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** «месяц», «месяца», «месяцев». */
export function plural(n: number, one: string, few: string, many: string): string {
  const m = n % 10;
  const h = n % 100;
  if (m === 1 && h !== 11) return one;
  if (m >= 2 && m <= 4 && (h < 12 || h > 14)) return few;
  return many;
}
export const months = (n: number): string => `${n}${NB}${plural(n, 'месяц', 'месяца', 'месяцев')}`;
export const years = (n: number): string => `${n}${NB}${plural(n, 'год', 'года', 'лет')}`;

/** Порядковое «11-й», «3-го». */
export const ord = (n: number, ending: 'й' | 'го' | 'м'): string => `${n}-${ending}`;

/** Подлежащее с целью: «Кира берёт кредит на ноутбук…». */
export const takes = (p: PlotFull): string => `${p.subject} берёт кредит ${p.goal}`;
export const took = (p: PlotFull): string =>
  `${p.subject} ${v(p, 'взял', 'взяла')} кредит ${p.goal}`;

/** Рамка «15-е число». `n` — срок или null, если срок неизвестен. */
export function frame15(
  p: PlotFull,
  month: number,
  n: number | null,
  r: DrobInput | string,
): string {
  const term = n === null ? 'на некоторое количество месяцев' : `на ${months(n)}`;
  const rate = typeof r === 'string' ? r : pct(r);
  return (
    `15-го ${MONTHS_GEN[month] ?? 'января'} ${p.subject} ${v(p, 'планирует', 'планирует')} взять кредит ${p.goal} ${term}. Условия его возврата таковы:\n` +
    `— 1-го числа каждого месяца долг возрастает на ${rate} по сравнению с концом предыдущего месяца;\n` +
    `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
    `— 15-го числа каждого месяца долг должен быть на одну и ту же величину меньше долга на 15-е число предыдущего месяца.`
  );
}

/** Рамка «июль» (годовой дифференцированный). */
export function frameJuly(
  p: PlotFull,
  sum: string,
  n: number | null,
  r: DrobInput | string,
): string {
  const term = n === null ? 'на $n$ лет' : `на ${years(n)}`;
  const rate = typeof r === 'string' ? r : pct(r);
  return (
    `В июле ${p.year} года ${p.subject} ${v(p, 'планирует', 'планирует')} взять кредит ${p.goal} в размере ${sum} ${term}. Условия его возврата таковы:\n` +
    `— каждый январь долг возрастает на ${rate} по сравнению с концом предыдущего года;\n` +
    `— с февраля по июнь каждого года необходимо выплатить часть долга;\n` +
    `— в июле каждого года долг должен быть на одну и ту же величину меньше долга на июль предыдущего года.`
  );
}

/** Рамка «январь» (годовой, выплата одним платежом). `sum` — «на сумму 275 000 рублей» или пусто. */
export function frameJan(
  p: PlotFull,
  sumPhrase: string,
  r: DrobInput | string,
  extra: string[] = [],
): string {
  const rate = typeof r === 'string' ? r : pct(r);
  return (
    `В июле ${p.year} года ${p.subject} ${v(p, 'планирует', 'планирует')} взять кредит ${p.goal}${sumPhrase ? ' ' + sumPhrase : ''}. Условия его возврата таковы:\n` +
    `— каждый январь долг увеличивается на ${rate} по сравнению с концом предыдущего года;\n` +
    `— с февраля по июнь каждого года необходимо выплатить одним платежом часть долга` +
    (extra.length ? ';\n' + extra.map((e) => `— ${e}`).join(';\n') + '.' : '.')
  );
}

/** Рамка «конец периода»: «В конце каждого месяца банк начисляет r %, затем … вносит платёж». */
export function frameEnd(p: PlotFull, period: 'month' | 'year', r: DrobInput | string): string {
  const rate = typeof r === 'string' ? r : pct(r);
  const each = period === 'month' ? 'каждого месяца' : 'каждого года';
  return `В конце ${each} банк начисляет ${rate} на оставшуюся сумму долга, затем ${p.firm ? 'компания' : p.subject} ${p.g === 'f' || p.firm ? 'вносит' : 'вносит'} очередной платёж.`;
}

export const DIF_RULE =
  'Платежи подобраны так, что сумма долга каждый месяц уменьшается на одну и ту же величину.';
export const DIF_RULE_YEAR =
  'Платежи подобраны так, что сумма долга каждый год уменьшается на одну и ту же величину.';
