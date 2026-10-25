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
import { money, months, pct, years } from '../text';
import { annBukvy } from '../bukvy';
import { choice, hintType, step, tex } from './common';
import { raskryto, stChisla, stFormula, stTablitsaBukvy, stUravnenie } from './razbor';
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
    const pereplataLine = `P = \\dfrac{${tex(S)}\\cdot ${n + 1}}{2}\\cdot\\dfrac{${tex(r)}}{100} = ${tex(S.mul(n + 1).div(2))}\\cdot ${tex(r.div(100))} = ${tex(formula.overpay)}`;
    const startLine = `\\dfrac{(n-m+1)S}{n} = \\dfrac{${n - m + 1}\\cdot ${tex(S)}}{${n}} = ${tex(startM)}`;
    const itog: Record<DifAsk, { text: string; f: string; chisla: string[] }> = {
      change: {
        text: 'Сумма изменения долга — кредит, делённый на число месяцев.',
        f: '\\dfrac{S}{n}',
        chisla: [`\\dfrac{S}{n} = \\dfrac{${tex(S)}}{${n}} = ${tex(change)}`],
      },
      interest: {
        text: 'Переплата за $m$-й месяц — $r\\,\\%$ от долга на начало этого месяца.',
        f: 'P_{m} = \\dfrac{(n-m+1)S}{n}\\cdot\\dfrac{r}{100}',
        chisla: [
          startLine,
          `P_{${m}} = ${tex(startM)}\\cdot\\dfrac{${tex(r)}}{100} = ${tex(formula.interest)}`,
        ],
      },
      end: {
        text: 'Долг на конец $m$-го месяца — осталось $n - m$ частей по $\\dfrac{S}{n}$.',
        f: 'D_{m} = \\dfrac{(n-m)S}{n}',
        chisla: [`D_{${m}} = \\dfrac{${n - m}\\cdot ${tex(S)}}{${n}} = ${tex(formula.end)}`],
      },
      payment: {
        text: 'Платёж $m$-го месяца — сумма изменения долга плюс переплата за этот месяц.',
        f: 'x_{m} = \\dfrac{S}{n} + \\dfrac{(n-m+1)S}{n}\\cdot\\dfrac{r}{100}',
        chisla: [
          `\\dfrac{S}{n} = \\dfrac{${tex(S)}}{${n}} = ${tex(change)}, \\qquad ${startLine}`,
          `x_{${m}} = ${tex(change)} + ${tex(startM)}\\cdot\\dfrac{${tex(r)}}{100} = ${tex(change)} + ${tex(formula.interest)} = ${tex(formula.payment)}`,
        ],
      },
      overpay: {
        text: 'Переплата за весь срок — сумма столбца «Переплата».',
        f: 'P = \\dfrac{S(n+1)}{2}\\cdot\\dfrac{r}{100}',
        chisla: [pereplataLine],
      },
      total: {
        text: 'Всего вернуть банку — весь кредит плюс переплата за весь срок.',
        f: 'Z = S + \\dfrac{S(n+1)}{2}\\cdot\\dfrac{r}{100}',
        chisla: [pereplataLine, `Z = ${tex(S)} + ${tex(formula.overpay)} = ${tex(formula.total)}`],
      },
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
        stTablitsaBukvy(
          'Сумма изменения долга — на сколько долг уменьшается за месяц. Долг уменьшается одинаково и за $n$ месяцев доходит до нуля, поэтому кредит $S$ делим на число месяцев: этот столбец одинаковый сверху донизу. Переплата — деньги, которые отдаём банку сверх того, что взяли: $r\\,\\%$ от долга на начало месяца. Долг на конец = долг на начало − сумма изменения долга; он же — долг на начало следующего месяца.',
        ),
        {
          title: 'Записываем формулы строки',
          text: 'Возьмём месяц с номером $m$. До него долг уменьшился $m - 1$ раз: на начало месяца осталось $n - m + 1$ частей по $\\dfrac{S}{n}$, на конец — $n - m$ частей. Платёж месяца — сумма изменения долга плюс переплата.',
          bloki: [
            {
              vid: 'formula',
              tex: 'D_{m-1} = \\dfrac{(n-m+1)S}{n}, \\qquad D_{m} = \\dfrac{(n-m)S}{n}',
            },
            {
              vid: 'formula',
              tex: 'P_{m} = \\dfrac{(n-m+1)S}{n}\\cdot\\dfrac{r}{100}, \\qquad x_{m} = \\dfrac{S}{n} + P_{m}',
            },
            {
              vid: 'text',
              text: 'Итоги: столбец «Сумма изменения долга» в сумме даёт весь кредит $S$, столбец «Переплата» — переплату за весь срок $P$, вместе — всё, что вернули банку, $Z$. Долги на начало месяцев — $S, \\dfrac{(n-1)S}{n}, \\dots, \\dfrac{S}{n}$, их сумма $\\dfrac{S}{n}\\big(n + (n-1) + \\dots + 1\\big) = \\dfrac{S(n+1)}{2}$.',
            },
            {
              vid: 'formula',
              tex: 'P = \\dfrac{r}{100}\\Big(S + \\dfrac{(n-1)S}{n} + \\dots + \\dfrac{S}{n}\\Big) = \\dfrac{S(n+1)}{2}\\cdot\\dfrac{r}{100}, \\qquad Z = S + P',
            },
          ],
        },
        stFormula(itog[ask].text, itog[ask].f),
        stChisla(
          `$S = ${tex(S)}$, $n = ${n}$, $r = ${tex(r)}$${['interest', 'end', 'payment'].includes(ask) ? `, $m = ${m}$` : ''}.`,
          itog[ask].chisla,
          ask === 'overpay' || ask === 'total'
            ? `Проверка по столбцу «Переплата»: $${rows.map((x) => tex(x.interest)).join(' + ')} = ${tex(totalOver)}$.`
            : undefined,
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
    // «по правилам»: долг после начисления = долг на начало · k; долг на конец = долг после начисления − платёж
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
      after: `долг после начисления ${inYear(y - 1)} год`,
      end: `долг на конец ${ORD_GEN[y - 1]} года`,
      last: 'последний платёж',
    };
    /* Разбор в буквах: степень k и сколько платежей входит в ответ. */
    const opsX = pays.map((_, i) => `- x_{${i + 1}}`);
    const uravnenie = stUravnenie(opsX, { nol: false, title: 'Записываем долг по годам' });
    const e = ask === 'last' ? n : y;
    const J = ask === 'after' ? y - 1 : ask === 'end' ? y : n - 1;
    const opsJ = [...opsX.slice(0, J), ...(J < e ? [''] : [])];
    const chleny = Array.from({ length: J }, (_, i) => i + 1);
    const imya =
      ask === 'end'
        ? `D_{${y}}`
        : ask === 'last'
          ? `x_{${n}} = D_{${n - 1}}\\,k`
          : y === 1
            ? ''
            : `D_{${y - 1}}\\,k`;
    const imyaChisla =
      ask === 'end' ? `D_{${y}}` : ask === 'last' ? `x_{${n}}` : `D_{${y - 1}}\\,k`;
    const itogText =
      ask === 'end'
        ? y === 1
          ? 'Долг на конец первого года — первая строка таблицы.'
          : `Долг на конец ${ORD_GEN[y - 1]} года — раскрываем скобки в формуле для $D_{${y}}$.`
        : ask === 'last'
          ? 'Последний платёж — весь долг после начисления в последний год; раскрываем скобки.'
          : y === 1
            ? 'Долг после начисления в первый год — сумма кредита, умноженная на $k$.'
            : `Долг после начисления ${inYear(y - 1)} год — долг на начало этого года, умноженный на $k$; раскрываем скобки.`;
    const znach = chleny.reduce(
      (acc, j) => acc.sub(pays[j - 1]!.mul(k.pow(e - j))),
      S.mul(k.pow(e)),
    );
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
        stTablitsaBukvy(
          'Начислить $r\\,\\%$ — значит умножить долг на $k = 1 + \\dfrac{r}{100}$: было 100 %, стало $(100 + r)\\,\\%$. Долг после начисления = долг на начало · $k$. Долг на конец $D_{i}$ = долг после начисления − платёж $x_{i}$; он же — долг на начало следующего года. В последний год платёж равен всему долгу после начисления — после него долг ноль.',
          annBukvy({ n, period: 'year', platezh: (i) => `x_{${i}}` }),
        ),
        {
          ...uravnenie,
          bloki: [
            ...(uravnenie.bloki ?? []),
            { vid: 'text', text: 'Последний платёж гасит весь долг после начисления:' },
            {
              vid: 'formula',
              tex: `D_{${n}} = D_{${n - 1}}\\,k - x_{${n}} = 0 \\;\\Rightarrow\\; x_{${n}} = D_{${n - 1}}\\,k`,
            },
          ],
        },
        stFormula(itogText, imya ? `${imya} = ${raskryto(opsJ)}` : raskryto(opsJ)),
        stChisla(
          `$S = ${tex(S)}$, ${pays.map((p, i) => `$x_{${i + 1}} = ${tex(p)}$`).join(', ')}, $r = ${tex(r)}$.`,
          [
            `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}${Array.from({ length: e - 1 }, (_, i) => `, \\qquad k^{${i + 2}} = ${tex(k.pow(i + 2))}`).join('')}`,
            J === 0
              ? `Sk = ${tex(S)}\\cdot ${tex(k)} = ${tex(znach)}`
              : `${imyaChisla} = ${tex(S)}\\cdot ${tex(k.pow(e))}${chleny.map((j) => ` - ${tex(pays[j - 1]!)}${e - j > 0 ? `\\cdot ${tex(k.pow(e - j))}` : ''}`).join('')} = ${tex(S.mul(k.pow(e)))}${chleny.map((j) => ` - ${tex(pays[j - 1]!.mul(k.pow(e - j)))}`).join('')} = ${tex(znach)}`,
          ],
        ),
        stAnswer(`${money(formula[ask], 'rub')}.`),
      ],
      hints: [
        hintType('C', rng.int(0, 2)),
        choice(
          'Как найти долг после начисления?',
          'Долг на начало умножить на $k$',
          ['Долг на начало плюс $r$', 'Долг на начало умножить на $\\dfrac{r}{100}$'],
          rng.int(0, 2),
        ),
        choice(
          'Каким должен быть последний платёж?',
          'Равным всему долгу после начисления в последний год',
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
    /* Разбор в буквах: степень k и сколько лет операций входит в ответ. */
    const znak = sign > 0 ? '+' : '-';
    const opsL = Array.from({ length: n }, (_, i) =>
      i + 1 === opYear ? (sign > 0 ? '+ y' : '- x') : '',
    );
    const e = ask === 'final' ? n : y;
    const J = ask === 'after' ? y - 1 : e;
    const opsJ = [...opsL.slice(0, J), ...(J < e ? [''] : [])];
    const sOp = opYear <= J;
    const uravnenieV0 = stUravnenie(opsL, {
      D: 'V',
      nol: false,
      title: 'Записываем вклад по годам',
    });
    // vlozheno() пишет «((Sk + y)k)k», когда два года подряд операций нет: сворачиваем в k².
    const uravnenieV = {
      ...uravnenieV0,
      bloki: (uravnenieV0.bloki ?? []).map((b) =>
        b.vid === 'formula'
          ? { ...b, tex: b.tex.replace(/\(\((Sk [+-] [xy])\)k\)k$/, '($1)k^{2}') }
          : b,
      ),
    };
    const imya = ask === 'after' ? (y === 1 ? '' : `V_{${y - 1}}\\,k`) : `V_{${e}}`;
    const imyaChisla = ask === 'after' ? (y === 1 ? 'Sk' : `V_{${y - 1}}\\,k`) : `V_{${e}}`;
    const itogText =
      ask === 'after'
        ? y === 1
          ? 'Вклад после начисления в первый год — первоначальный вклад, умноженный на $k$.'
          : `Вклад после начисления ${inYear(y - 1)} год — вклад на начало этого года, умноженный на $k$; раскрываем скобки.`
        : e === 1
          ? 'Вклад на конец первого года — первая строка таблицы.'
          : `Вклад на конец ${ORD_GEN[e - 1]} года — раскрываем скобки в формуле для $V_{${e}}$.`;
    const znach = S.mul(k.pow(e)).add(sOp ? op.mul(k.pow(e - opYear)) : D(0));
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
        stTablitsaBukvy(
          'Начислить $r\\,\\%$ — умножить вклад на $k = 1 + \\dfrac{r}{100}$. Вклад после начисления = вклад на начало · $k$. Вклад на конец $V_{i}$ = после начисления плюс пополнение $y$ (или минус снятие $x$); он же — вклад на начало следующего года.',
        ),
        uravnenieV,
        stFormula(itogText, imya ? `${imya} = ${raskryto(opsJ)}` : raskryto(opsJ)),
        stChisla(`$S = ${tex(S)}$, $${sign > 0 ? 'y' : 'x'} = ${tex(amount)}$, $r = ${tex(r)}$.`, [
          `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}${Array.from({ length: e - 1 }, (_, i) => `, \\qquad k^{${i + 2}} = ${tex(k.pow(i + 2))}`).join('')}`,
          e === 1 && !sOp
            ? `Sk = ${tex(S)}\\cdot ${tex(k)} = ${tex(znach)}`
            : sOp
              ? `${imyaChisla} = ${tex(S)}\\cdot ${tex(k.pow(e))} ${znak} ${tex(amount)}${e - opYear > 0 ? `\\cdot ${tex(k.pow(e - opYear))}` : ''} = ${tex(S.mul(k.pow(e)))} ${znak} ${tex(amount.mul(k.pow(e - opYear)))} = ${tex(znach)}`
              : `${imyaChisla} = ${tex(S)}\\cdot ${tex(k.pow(e))} = ${tex(znach)}`,
        ]),
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
