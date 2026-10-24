/**
 * Подготовительные прототипы задания №13 «таблица руками» (P-01 … P-03).
 *
 * Маленькие круглые числа, один вопрос — одна ячейка или итог таблицы.
 * Решение объясняет простыми словами, что такое переплата, сумма
 * изменения долга и долг на конец (docs/13-economics/01-analysis.md, § 3.3).
 */

import { D, type Drob, kOf, sum } from '../drob';
import { v } from '../plots';
import { byPayments, deposit, differentiated, type Row } from '../solver';
import { money, months, num, pct, years } from '../text';
import { choice, hintType, step, tex } from './common';
import type { Prototype } from './types';

const stAnswer = (text: string) => step('Ответ', text);

const ORD_GEN = ['первого', 'второго', 'третьего', 'четвёртого'];
const ORD_ACC = ['первый', 'второй', 'третий', 'четвёртый'];
/** «в первый год», «во второй год». */
const inYear = (i: number): string => (i === 1 ? 'во второй' : `в ${ORD_ACC[i]}`);

/* ── P-01: дифференцированный платёж руками ───────────────────── */

type DifAsk = 'change' | 'interest' | 'end' | 'payment' | 'overpay' | 'total';

const P01: Prototype = {
  id: 'P-01',
  type: 'A',
  subtype: 'П1',
  source: 'own',
  sourceNote: 'авторская (подготовительная)',
  difficulty: 'base',
  units: 'rub',
  title: 'Таблица руками: дифференцированный платёж',
  plot: { kind: 'credit', allowFirm: false },
  forbid: [{ S: 1000, n: 4, r: 10 }],
  make({ rng, plot }) {
    const n = rng.int(2, 4);
    const r = D(rng.pick([5, 10, 20]));
    const S = D(rng.int(1, 12) * 500);
    const change = S.div(n);
    if (!change.isInteger()) return null;
    const rows = differentiated(S, n, r);
    if (!rows.every((x) => x.interest.isInteger())) return null;
    const ask = rng.pick<DifAsk>(['change', 'interest', 'end', 'payment', 'overpay', 'total']);
    const m = rng.int(1, ask === 'end' ? n - 1 : n);
    const row = rows[m - 1]!;
    const totalOver = sum(rows.map((x) => x.interest));
    // ответ «по правилам», без солвера
    const startM = S.sub(change.mul(m - 1));
    const formula: Record<DifAsk, Drob> = {
      change,
      interest: startM.mul(r).div(100),
      end: startM.sub(change),
      payment: change.add(startM.mul(r).div(100)),
      overpay: S.mul(n + 1)
        .div(2)
        .mul(r)
        .div(100),
      total: S.add(
        S.mul(n + 1)
          .div(2)
          .mul(r)
          .div(100),
      ),
    };
    const fromSolver: Record<DifAsk, Drob> = {
      change: row.change,
      interest: row.interest,
      end: row.end,
      payment: row.payment,
      overpay: totalOver,
      total: S.add(totalOver),
    };
    const question: Record<DifAsk, string> = {
      change: 'сумму изменения долга — на сколько рублей долг уменьшается каждый месяц',
      interest: `переплату за ${ORD_ACC[m - 1]} месяц`,
      end: `долг на конец ${ORD_GEN[m - 1]} месяца`,
      payment: `платёж ${ORD_GEN[m - 1]} месяца`,
      overpay: 'переплату за весь срок',
      total: 'сколько всего рублей нужно вернуть банку',
    };
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} в кредит ${money(S, 'rub')} на ${months(n)}. Каждый месяц долг уменьшается на одну и ту же сумму, а банк начисляет ${pct(r)} на долг, который был в начале месяца. ` +
        `Заполни таблицу и найди ${question[ask]}.`,
      answer: formula[ask],
      verify: fromSolver[ask],
      params: { S: S.toNumber(), n, r: r.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        step(
          'Сумма изменения долга',
          `Это на сколько уменьшается долг за месяц. Долг уменьшается одинаково и за ${months(n)} доходит до нуля, поэтому делим кредит на число месяцев. Этот столбец одинаковый сверху донизу.`,
          `${tex(S)} : ${n} = ${tex(change)}`,
        ),
        step(
          'Переплата',
          `Переплата — деньги, которые отдаём банку сверх того, что взяли. За месяц это ${num(r)} % от долга на начало месяца: пропорция «${num(startM)} — 100 %, ? — ${num(r)} %».`,
          `${tex(startM)}\\cdot\\frac{${tex(r)}}{100} = ${tex(startM.mul(r).div(100))}\\quad\\text{(в ${m}-м месяце)}`,
        ),
        step(
          'Долг на конец',
          'Долг на конец = долг на начало − сумма изменения долга. Он же — долг на начало следующего месяца.',
          `${tex(startM)} - ${tex(change)} = ${tex(startM.sub(change))}`,
        ),
        step(
          'Заполняем таблицу',
          'Так строка за строкой до нуля. Платёж месяца — сумма изменения долга плюс переплата.',
          undefined,
          true,
        ),
        step(
          'Итоги',
          'Сумма столбца «Сумма изменения долга» — это весь кредит. Сумма столбца «Переплата» — переплата за весь срок. Вместе — всё, что вернули банку.',
          `S = ${tex(S)},\\quad S_{\\text{перепл}} = ${rows.map((x) => tex(x.interest)).join(' + ')} = ${tex(totalOver)},\\quad S_{\\text{общ}} = ${tex(S.add(totalOver))}`,
        ),
        stAnswer(`${money(formula[ask], 'rub')}.`),
      ],
      hints: [
        hintType('A', rng.int(0, 2)),
        choice(
          'Как узнать долг на конец месяца?',
          'Долг на начало минус сумма изменения долга',
          ['Долг на начало минус переплата', 'Долг на начало плюс переплата'],
          rng.int(0, 2),
        ),
        choice(
          'От какого долга считают переплату за месяц?',
          'От долга на начало месяца',
          ['От долга на конец месяца', 'Всегда от всей суммы кредита'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── P-02: аннуитет руками ────────────────────────────────────── */

type AnnAsk = 'after' | 'end' | 'last';

const P02: Prototype = {
  id: 'P-02',
  type: 'C',
  subtype: 'П2',
  source: 'own',
  sourceNote: 'авторская (подготовительная)',
  difficulty: 'base',
  units: 'rub',
  title: 'Таблица руками: аннуитет и известные платежи',
  plot: { kind: 'credit', allowFirm: false },
  forbid: [{ S: 2100, n: 2, r: 10 }],
  make({ rng, plot }) {
    const n = rng.int(2, 3);
    const r = D(rng.pick([5, 10, 20]));
    const k = kOf(r);
    const S = D(rng.int(10, 60) * 100);
    const pays: Drob[] = [];
    let debt = S;
    for (let i = 0; i < n - 1; i++) {
      const after = debt.mul(k);
      const p = D(Math.round((after.toNumber() * rng.int(35, 65)) / 100 / 100) * 100);
      if (!p.isPositive() || !p.lt(after)) return null;
      pays.push(p);
      debt = after.sub(p);
    }
    const lastPay = debt.mul(k);
    if (!lastPay.isInteger() || !lastPay.isPositive()) return null;
    const rows = byPayments(S, [...pays, lastPay], r);
    if (!rows[n - 1]!.end.eq(0)) return null;
    const ask = rng.pick<AnnAsk>(['after', 'end', 'last']);
    const y = ask === 'last' ? n : rng.int(1, ask === 'end' ? n - 1 : n);
    // «по правилам»: долг с процентами = долг на начало · k; долг на конец = долг с процентами − платёж
    let start = S;
    const byRule: { after: Drob; end: Drob }[] = [];
    for (let i = 0; i < n; i++) {
      const after = start.mul(k);
      const end = i < n - 1 ? after.sub(pays[i]!) : D(0);
      byRule.push({ after, end });
      start = end;
    }
    const formula: Record<AnnAsk, Drob> = {
      after: byRule[y - 1]!.after,
      end: byRule[y - 1]!.end,
      last: byRule[n - 1]!.after,
    };
    const fromSolver: Record<AnnAsk, Drob> = {
      after: rows[y - 1]!.afterInterest,
      end: rows[y - 1]!.end,
      last: rows[n - 1]!.payment,
    };
    const payText = pays.map((p, i) => `${inYear(i)} год — ${money(p, 'rub')}`).join(', ');
    const question: Record<AnnAsk, string> = {
      after: `долг с процентами ${inYear(y - 1)} год`,
      end: `долг на конец ${ORD_GEN[y - 1]} года`,
      last: 'последний платёж',
    };
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} в кредит ${money(S, 'rub')} на ${years(n)} под ${pct(r)} годовых. В конце каждого года банк начисляет проценты на оставшийся долг, затем вносится платёж: ${payText}, а последним платежом долг гасится полностью. ` +
        `Заполни таблицу и найди ${question[ask]}.`,
      answer: formula[ask],
      verify: fromSolver[ask],
      params: { S: S.toNumber(), n, r: r.toNumber() },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        step(
          'Коэффициент $k$',
          `Начислить ${num(r)} % — значит умножить долг на $k$: было 100 %, стало ${num(D(100).add(r))} %.`,
          `k = 1 + \\frac{${tex(r)}}{100} = ${tex(k)}`,
        ),
        step(
          'Долг с процентами',
          'Долг с процентами = долг на начало · $k$.',
          `${tex(S)}\\cdot ${tex(k)} = ${tex(S.mul(k))}\\quad\\text{(в первый год)}`,
        ),
        step(
          'Долг на конец',
          'Долг на конец = долг с процентами − платёж. Он же — долг на начало следующего года.',
          `${tex(S.mul(k))} - ${tex(pays[0]!)} = ${tex(S.mul(k).sub(pays[0]!))}`,
        ),
        step(
          'Заполняем таблицу',
          'Так год за годом. В последний год платёж равен всему долгу с процентами — после него долг ноль.',
          undefined,
          true,
        ),
        stAnswer(`${money(formula[ask], 'rub')}.`),
      ],
      hints: [
        hintType('C', rng.int(0, 2)),
        choice(
          'Как найти долг с процентами?',
          'Долг на начало умножить на $k$',
          ['Долг на начало плюс $r$', 'Долг на начало умножить на $\\dfrac{r}{100}$'],
          rng.int(0, 2),
        ),
        choice(
          'Каким должен быть последний платёж?',
          'Равным всему долгу с процентами в последний год',
          ['Равным предыдущему платежу', 'Равным сумме кредита'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── P-03: вклад руками ───────────────────────────────────────── */

type DepAsk = 'after' | 'end' | 'final';

const P03: Prototype = {
  id: 'P-03',
  type: 'D',
  subtype: 'П3',
  source: 'own',
  sourceNote: 'авторская (подготовительная)',
  difficulty: 'base',
  units: 'rub',
  title: 'Таблица руками: вклад с пополнением или снятием',
  plot: { kind: 'deposit' },
  make({ rng, plot }) {
    const n = rng.int(2, 3);
    const r = D(rng.pick([5, 10, 20]));
    const k = kOf(r);
    const S = D(rng.int(1, 12) * 500);
    const opYear = rng.int(1, n - 1);
    const sign = rng.pick([1, -1]);
    const amount = D(rng.int(1, 6) * 100);
    const op = amount.mul(sign);
    const after = Array.from({ length: n }, (_, i) => (i + 1 === opYear ? op : D(0)));
    const rows: Row[] = deposit(S, n, r, { after });
    if (
      !rows.every(
        (x) =>
          x.end.isPositive() &&
          x.afterInterest.isFiniteDecimal() &&
          x.afterInterest.decimals() <= 2,
      )
    )
      return null;
    const ask = rng.pick<DepAsk>(['after', 'end', 'final']);
    const y = ask === 'final' ? n : rng.int(1, n);
    let cur = S;
    const byRule: { after: Drob; end: Drob }[] = [];
    for (let i = 0; i < n; i++) {
      const a = cur.mul(k);
      const e = a.add(i + 1 === opYear ? op : D(0));
      byRule.push({ after: a, end: e });
      cur = e;
    }
    const formula: Record<DepAsk, Drob> = {
      after: byRule[y - 1]!.after,
      end: byRule[y - 1]!.end,
      final: byRule[n - 1]!.end,
    };
    const fromSolver: Record<DepAsk, Drob> = {
      after: rows[y - 1]!.afterInterest,
      end: rows[y - 1]!.end,
      final: rows[n - 1]!.end,
    };
    if (!formula[ask].isFiniteDecimal() || formula[ask].decimals() > 2) return null;
    const opText =
      sign > 0
        ? `${plot.g === 'f' ? 'она пополнила' : 'он пополнил'} вклад на ${money(amount, 'rub')}`
        : `${plot.g === 'f' ? 'она сняла' : 'он снял'} со вклада ${money(amount, 'rub')}`;
    const question: Record<DepAsk, string> = {
      after: `сумму на счёте после начисления процентов ${inYear(y - 1)} год`,
      end: `сумму на счёте в конце ${ORD_GEN[y - 1]} года`,
      final: `сколько будет на счёте через ${years(n)}`,
    };
    return {
      condition:
        `${plot.subject} ${v(plot, 'положил', 'положила')} ${money(S, 'rub')} ${plot.goal} в банк на ${years(n)} под ${pct(r)} годовых. В конце каждого года банк начисляет проценты на сумму, которая была на счёте в начале года. В конце ${ORD_GEN[opYear - 1]} года, после начисления процентов, ${opText}. ` +
        `Заполни таблицу и найди ${question[ask]}.`,
      answer: formula[ask],
      verify: fromSolver[ask],
      params: { S: S.toNumber(), n, r: r.toNumber(), op: op.toNumber() },
      rows,
      scheme: 'dep',
      period: 'year',
      solution: [
        step(
          'Коэффициент $k$',
          `Начислить ${num(r)} % — умножить вклад на $k$.`,
          `k = 1 + \\frac{${tex(r)}}{100} = ${tex(k)}`,
        ),
        step(
          'После начисления',
          'Вклад после начисления = вклад на начало · $k$.',
          `${tex(S)}\\cdot ${tex(k)} = ${tex(S.mul(k))}\\quad\\text{(в первый год)}`,
        ),
        step(
          'Пополнение или снятие',
          'Вклад на конец = после начисления плюс пополнение (или минус снятие). Он же — вклад на начало следующего года.',
          `${tex(byRule[opYear - 1]!.after)} ${sign > 0 ? '+' : '-'} ${tex(amount)} = ${tex(byRule[opYear - 1]!.end)}\\quad\\text{(в ${opYear}-й год)}`,
        ),
        step('Заполняем таблицу', 'Так год за годом.', undefined, true),
        stAnswer(`${money(formula[ask], 'rub')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'В каком порядке считаем каждый год?',
          'Сначала начисляем проценты, потом пополняем или снимаем',
          [
            'Сначала пополняем, потом начисляем проценты',
            'Проценты начисляем только в последний год',
          ],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

export const PROTO_P: Prototype[] = [P01, P02, P03];
