/**
 * Шаги разбора в буквах (решение автора от 24.10.2026). Порядок всегда
 * один: таблица в буквах → уравнение в буквах → преобразования, каждое
 * подписано → итоговая формула → подстановка чисел и ответ.
 *
 * Операции по годам — строки TeX со знаком: «- x», «- 3x», «+ y»,
 * «- x_{1}»; пустая строка — в этот год ничего не вносят и не снимают.
 */

import type { ShagBlok, SolutionStep, TablitsaPeremennye } from '../types';
import { step } from './common';

/** k в степени: «», «k», «k^{3}». */
export const kSt = (e: number): string => (e === 0 ? '' : e === 1 ? 'k' : `k^{${e}}`);

/**
 * Сумма на конец i-го года без обозначений: «(Sk - x)k - 3x»,
 * «Sk^{2} + y». Пока операций не было, S просто умножается на k.
 */
export function vlozheno(ops: readonly string[], i: number): string {
  let s = 'S';
  for (let j = 0; j < i; j++) {
    const m = /^S(?:k(?:\^\{(\d+)\})?)?$/.exec(s);
    if (m) {
      const st = s === 'S' ? 0 : m[1] ? Number(m[1]) : 1;
      s = `S${kSt(st + 1)}`;
    } else s = `(${s})k`;
    const op = ops[j] ?? '';
    if (op) s = `${s} ${op}`;
  }
  return s;
}

/** Скобки раскрыты: «Sk^{3} - xk^{2} - xk - x». */
export function raskryto(ops: readonly string[]): string {
  const n = ops.length;
  const chleny = ops.flatMap((op, j) => (op ? [`${op}${kSt(n - 1 - j)}`] : []));
  return [`S${kSt(n)}`, ...chleny].join(' ');
}

/** Снятия и платежи перенесены вправо: «Sk^{3} = xk^{2} + 3xk + 9x». */
export function perenos(ops: readonly string[]): string {
  const n = ops.length;
  const pravo = ops.flatMap((op, j) => (op ? [`${op.replace(/^- /, '')}${kSt(n - 1 - j)}`] : []));
  return `S${kSt(n)} = ${pravo.join(' + ')}`;
}

/**
 * Шаг «Составляем уравнение»: каждая строка таблицы — в следующую.
 * D — буква суммы на конец года (D у долга, D' у второй схемы, V у
 * вклада); nol — после последней операции на счёте ноль, тогда в конце
 * уравнение «… = 0».
 */
export function stUravnenie(
  ops: readonly string[],
  opts: { D?: string; kto?: string; nol?: boolean; title?: string; text?: string } = {},
): SolutionStep {
  const D = opts.D ?? 'D';
  const n = ops.length;
  const op = (j: number) => (ops[j] ? ` ${ops[j]}` : '');
  const bloki: ShagBlok[] = [];
  for (let i = 1; i <= n; i++) {
    const prev = i === 1 ? 'Sk' : `${D}_{${i - 1}}\\,k`;
    const vyr = vlozheno(ops, i);
    const pervoe = `${prev}${op(i - 1)}`;
    bloki.push({
      vid: 'formula',
      tex: `${D}_{${i}} = ${pervoe}${pervoe === vyr ? '' : ` = ${vyr}`}`,
    });
  }
  if (opts.nol !== false) {
    bloki.push({
      vid: 'text',
      text:
        D === 'V'
          ? 'После последнего снятия на счёте ноль — это и есть уравнение:'
          : 'После последнего платежа долг равен нулю — это и есть уравнение:',
    });
    bloki.push({ vid: 'formula', tex: `${vlozheno(ops, n)} = 0` });
  }
  return {
    title: opts.title ?? 'Составляем уравнение',
    text:
      opts.text ??
      `${D === 'V' ? 'Вклад' : 'Долг'} на конец ${opts.kto ?? 'года'} — ${D === 'V' ? 'вклад' : 'долг'} на начало следующего: подставляем каждую строку таблицы в следующую.`,
    bloki,
  };
}

/** Шаг «Раскрываем скобки»: изнутри наружу. */
export const stRaskryvaem = (ops: readonly string[], konec = ' = 0'): SolutionStep =>
  step(
    'Раскрываем скобки',
    'Изнутри наружу: каждое умножение на $k$ повышает степень на единицу.',
    `${raskryto(ops)}${konec}`,
  );

/** Шаг «Итоговая формула». */
export const stFormula = (text: string, formula: string): SolutionStep =>
  step('Итоговая формула', text, formula);

/** Шаг «Подставляем числа»: формулы по порядку, в конце — пояснение. */
export const stChisla = (text: string, formuly: string[], posle?: string): SolutionStep => ({
  title: 'Подставляем числа',
  text,
  bloki: [
    ...formuly.map((tex): ShagBlok => ({ vid: 'formula', tex })),
    ...(posle ? [{ vid: 'text' as const, text: posle }] : []),
  ],
});

/** Таблица в буквах — первый шаг разбора; без t — таблица по модели задачи. */
export const stTablitsaBukvy = (
  text: string,
  t?: TablitsaPeremennye | TablitsaPeremennye[],
  title = 'Составляем таблицу',
): SolutionStep =>
  t === undefined
    ? step(title, text, undefined, true)
    : {
        title,
        text,
        bloki: (Array.isArray(t) ? t : [t]).map((x): ShagBlok => ({ vid: 'tablitsa', t: x })),
      };
