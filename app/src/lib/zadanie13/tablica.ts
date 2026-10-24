/**
 * Таблица по периодам: модель для решения, тренажёра «С оформлением»
 * и пустых таблиц листа. Форматы — решение автора от 23.10.2026.
 */

import type { Row } from './solver';
import type { PeriodRow, TableModel, TableScheme } from './types';

export const TABLE_HEAD: Record<
  TableScheme,
  { period: { month: string; year: string }; cols: string[] }
> = {
  dif: {
    period: { month: 'Месяц', year: 'Год' },
    cols: ['Долг на начало', 'Сумма изменения долга', 'Переплата', 'Долг на конец'],
  },
  ann: {
    period: { month: 'Месяц', year: 'Год' },
    cols: ['Долг на начало', 'Долг с процентами', 'Платёж', 'Долг на конец'],
  },
  dep: {
    period: { month: 'Месяц', year: 'Год' },
    cols: ['Вклад на начало', 'После начисления %', 'Пополнение / снятие', 'Вклад на конец'],
  },
};

/** Какие поля строки стоят в столбцах формата. */
export const TABLE_FIELDS: Record<TableScheme, (keyof PeriodRow)[]> = {
  dif: ['start', 'change', 'interest', 'end'],
  ann: ['start', 'afterInterest', 'payment', 'end'],
  dep: ['start', 'afterInterest', 'payment', 'end'],
};

/**
 * Какие строки показать: короткую таблицу целиком, длинную — как в
 * зачёте и тетради: 1, 2, 3, …, n−1, n и, если нужно, отдельные строки
 * из условия (платёж 11-го месяца). 0 — строка «…».
 */
export function shownRows(n: number, extra: readonly number[] = []): number[] {
  if (n <= 6) return Array.from({ length: n }, (_, i) => i + 1);
  const keep = new Set([1, 2, 3, n - 1, n, ...extra.filter((x) => x >= 1 && x <= n)]);
  const sorted = [...keep].sort((a, b) => a - b);
  const out: number[] = [];
  sorted.forEach((x, idx) => {
    const prev = sorted[idx - 1];
    if (prev !== undefined && x - prev > 1) out.push(0);
    out.push(x);
  });
  return out;
}

export function toTableModel(
  rows: readonly Row[],
  scheme: TableScheme,
  period: 'month' | 'year',
  opts: { labels?: string[]; extra?: number[] } = {},
): TableModel {
  const pr: PeriodRow[] = rows.map((r) => ({
    i: r.i,
    start: r.start.toNumber(),
    afterInterest: r.afterInterest.toNumber(),
    interest: r.interest.toNumber(),
    change: r.change.toNumber(),
    payment: r.payment.toNumber(),
    end: r.end.toNumber(),
    rate: r.rate.toNumber(),
  }));
  const sumOf = (k: 'change' | 'interest' | 'payment') => pr.reduce((a, x) => a + x[k], 0);
  return {
    scheme,
    period,
    labels: opts.labels ?? pr.map((x) => String(x.i)),
    rows: pr,
    show: shownRows(pr.length, opts.extra),
    totals:
      scheme === 'dep'
        ? undefined
        : { change: sumOf('change'), interest: sumOf('interest'), payment: sumOf('payment') },
  };
}
