/**
 * Независимый солвер задания №13: прямой пересчёт таблицы по периодам.
 *
 * Здесь нет формул типов (переплата через прогрессию, аннуитетная
 * дробь): только два события каждого периода — начисление процентов
 * и выплата (у вклада — пополнение или снятие). Поэтому солвер
 * проверяет формульное решение прототипа, а не повторяет его.
 *
 * Все величины — точные дроби (drob.ts).
 */

import { D, type Drob, type DrobInput, kOf, sum } from './drob';

export interface Row {
  i: number;
  start: Drob;
  afterInterest: Drob;
  interest: Drob;
  change: Drob;
  payment: Drob;
  end: Drob;
  rate: Drob;
}

const rates = (r: DrobInput | readonly DrobInput[], n: number): Drob[] =>
  Array.isArray(r)
    ? (r as DrobInput[]).map((x) => D(x))
    : Array.from({ length: n }, () => D(r as DrobInput));

/**
 * Кредит, у которого задан путь долга: долг после каждой выплаты.
 * Дифференцированный и «поломанный» платёж. Последний элемент `ends` — 0.
 */
export function byDebts(
  S: DrobInput,
  ends: readonly DrobInput[],
  r: DrobInput | readonly DrobInput[],
): Row[] {
  const rs = rates(r, ends.length);
  let debt = D(S);
  return ends.map((e, idx) => {
    const rate = rs[idx] ?? D(0n);
    const end = D(e);
    const afterInterest = debt.mul(kOf(rate));
    const row: Row = {
      i: idx + 1,
      start: debt,
      afterInterest,
      interest: afterInterest.sub(debt),
      change: debt.sub(end),
      payment: afterInterest.sub(end),
      end,
      rate,
    };
    debt = end;
    return row;
  });
}

/** Долг убывает равномерно: S − S/n, S − 2S/n, …, 0. */
export const evenEnds = (S: DrobInput, n: number): Drob[] =>
  Array.from({ length: n }, (_, i) =>
    D(S).sub(
      D(S)
        .mul(i + 1)
        .div(n),
    ),
  );

/** Дифференцированный платёж целиком. */
export const differentiated = (
  S: DrobInput,
  n: number,
  r: DrobInput | readonly DrobInput[],
): Row[] => byDebts(S, evenEnds(S, n), r);

/**
 * Кредит, у которого заданы платежи: долг считается от платежей.
 * Аннуитет и «известны платежи». Долг на конец последнего периода
 * может быть не нулём — это проверяет вызывающий.
 */
export function byPayments(
  S: DrobInput,
  payments: readonly DrobInput[],
  r: DrobInput | readonly DrobInput[],
): Row[] {
  const rs = rates(r, payments.length);
  let debt = D(S);
  return payments.map((p, idx) => {
    const rate = rs[idx] ?? D(0n);
    const afterInterest = debt.mul(kOf(rate));
    const payment = D(p);
    const end = afterInterest.sub(payment);
    const row: Row = {
      i: idx + 1,
      start: debt,
      afterInterest,
      interest: afterInterest.sub(debt),
      change: debt.sub(end),
      payment,
      end,
      rate,
    };
    debt = end;
    return row;
  });
}

/**
 * Вклад: начисление, затем операция (пополнение > 0, снятие < 0).
 * `before` — операции в начале периода, до начисления (пополнение
 * «в начале третьего года»); `after` — после начисления.
 */
export function deposit(
  S: DrobInput,
  n: number,
  r: DrobInput | readonly DrobInput[],
  ops: { before?: readonly DrobInput[]; after?: readonly DrobInput[] } = {},
): Row[] {
  const rs = rates(r, n);
  let sumNow = D(S);
  const rows: Row[] = [];
  for (let idx = 0; idx < n; idx++) {
    const before = D(ops.before?.[idx] ?? 0n);
    const after = D(ops.after?.[idx] ?? 0n);
    const start = sumNow.add(before);
    const rate = rs[idx] ?? D(0n);
    const afterInterest = start.mul(kOf(rate));
    const end = afterInterest.add(after);
    rows.push({
      i: idx + 1,
      start,
      afterInterest,
      interest: afterInterest.sub(start),
      change: end.sub(start),
      payment: after,
      end,
      rate,
    });
    sumNow = end;
  }
  return rows;
}

export const total = (rows: readonly Row[], key: 'payment' | 'interest' | 'change'): Drob =>
  sum(rows.map((x) => x[key]));

/** Сумма выплат кредита. */
export const totalPaid = (rows: readonly Row[]): Drob => total(rows, 'payment');

/** Переплата: сумма выплат минус кредит (она же сумма столбца «Переплата»). */
export const overpay = (rows: readonly Row[]): Drob => total(rows, 'interest');

/**
 * Равные платежи, гасящие кредит за n периодов, найденные без формулы:
 * долг после n периодов линеен по платежу X, поэтому X = долг(0) / (долг(0) − долг(1)).
 */
export function equalPayment(S: DrobInput, n: number, r: DrobInput | readonly DrobInput[]): Drob {
  const restWith = (x: Drob): Drob => {
    const rows = byPayments(
      S,
      Array.from({ length: n }, () => x),
      r,
    );
    return rows[rows.length - 1]?.end ?? D(S);
  };
  const a = restWith(D(0n));
  const b = restWith(D(1n));
  return a.div(a.sub(b));
}

/** Проверки корректности кредита: платежи положительные, долг убывает, в конце ноль. */
export function loanProblems(
  rows: readonly Row[],
  opts: { strictlyDecreasing?: boolean } = {},
): string[] {
  const out: string[] = [];
  const last = rows[rows.length - 1];
  if (!last || !last.end.eq(0n)) out.push('долг в конце не равен нулю');
  for (const row of rows) {
    if (!row.payment.isPositive()) out.push(`платёж ${row.i}-го периода не положительный`);
    if (row.end.lt(0n)) out.push(`долг после ${row.i}-го периода отрицательный`);
    if (
      opts.strictlyDecreasing !== false &&
      !row.end.lt(row.start) &&
      !(row.end.eq(0n) && row.start.eq(0n))
    ) {
      out.push(`долг не уменьшился в ${row.i}-м периоде`);
    }
  }
  return out;
}
