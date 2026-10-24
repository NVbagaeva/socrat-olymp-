/**
 * Прототипы задания №13: «поломанный» дифференцированный платёж (B-01 … B-19).
 * Список и источники — docs/13-economics/03-prototypes.md.
 *
 * Все решаются таблицей дифференцированного платежа (решение автора):
 * сумма столбца «Сумма изменения долга» по-прежнему равна S, переплату
 * считаем по кускам — ставка, умноженная на сумму долгов на начало.
 * Ответ формулы (`answer`) сверяется с солвером (`verify`): только
 * прямой пересчёт таблицы по периодам из solver.ts.
 */

import { D, type Drob, kOf, sum } from '../drob';
import { v } from '../plots';
import { byDebts, byPayments, differentiated, equalPayment, totalPaid } from '../solver';
import { MONTHS_GEN, money, months, num, pct, plural, years } from '../text';
import {
  choice,
  hintChangeSum,
  hintType,
  isNice,
  largestInt,
  smallestInt,
  step,
  tex,
} from './common';
import type { TablitsaPeremennye } from '../types';
import { stChisla, stFormula, stTablitsaBukvy } from './razbor';
import type { Prototype } from './types';

/* ── Общие куски ──────────────────────────────────────────────── */

const stTable = (text: string) => step('Составляем таблицу', text, undefined, true);

const stChangeSum = () =>
  step(
    'Главное правило',
    'Долг уменьшился с $S$ до нуля, поэтому столбец «Сумма изменения долга» в сумме даёт $S$. Значит, вся сумма выплат — это кредит плюс переплата, а переплата — ставка, умноженная на сумму долгов на начало периодов.',
    'S_{\\text{общ}} = S + S_{\\text{перепл}}',
  );

const stAnswer = (text: string) => step('Ответ', text);

/** «2027, 2028 и 2029». */
function yearList(from: number, count: number): string {
  const ys = Array.from({ length: count }, (_, i) => String(from + i));
  return ys.length === 1 ? ys[0]! : `${ys.slice(0, -1).join(', ')} и ${ys[ys.length - 1]}`;
}

/** Решение линейного уравнения f(x) = target по двум значениям функции (f линейна по x). */
function solveLinear(f: (x: Drob) => Drob, target: Drob): Drob {
  const f0 = f(D(0));
  const f1 = f(D(1));
  return target.sub(f0).div(f1.sub(f0));
}

/** Долги после выплат для «уменьшение на X первые m периодов, затем остаток». */
const fixedEnds = (S: Drob, X: Drob, m: number): Drob[] => [
  ...Array.from({ length: m }, (_, i) => S.sub(X.mul(i + 1))),
  D(0),
];

/** Рамка «15-е число» с фиксированным уменьшением на X и остатком в последний месяц. */
function frameFixed(
  subject: string,
  goal: string,
  month: number,
  n: number,
  r: string,
  X: Drob,
  sumPhrase = '',
): string {
  return (
    `15-го ${MONTHS_GEN[month]} ${subject} планирует взять кредит ${goal}${sumPhrase} на ${months(n)}. Условия его возврата таковы:\n` +
    `— 1-го числа каждого месяца долг возрастает на ${r} по сравнению с концом предыдущего месяца;\n` +
    `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
    `— 15-го числа каждого месяца с 1-го по ${n - 1}-й долг должен быть на ${money(X, 'thous')} меньше долга на 15-е число предыдущего месяца;\n` +
    `— к 15-му числу ${n}-го месяца кредит должен быть полностью погашен.`
  );
}

/** Таблица условия «Месяц и год | Июль … ; Долг | S | 0,7S | …». */
function julyTable(year: number, shares: Drob[], unit: string) {
  return {
    head: ['Месяц и год', ...shares.map((_, i) => `Июль ${year + i}`)],
    rows: [
      [`Долг (в ${unit})`, ...shares.map((x, i) => (i === 0 ? 'S' : x.eq(0) ? '0' : `${num(x)}S`))],
    ],
  };
}

/** Число для формулы: конечная дробь — десятичной записью, иначе обыкновенной. */
const texQ = (x: Drob): string => (x.isFiniteDecimal() ? tex(x) : `\\frac{${x.n}}{${x.d}}`);

const SHARES = [
  '0.9',
  '0.85',
  '0.8',
  '0.75',
  '0.7',
  '0.65',
  '0.6',
  '0.55',
  '0.5',
  '0.45',
  '0.4',
  '0.35',
  '0.3',
  '0.25',
  '0.2',
  '0.15',
  '0.1',
];

/** Доли таблицы Б3: S, aS, bS, 0, a > b. */
function pickShares(rng: { sample<T>(items: readonly T[], n: number): T[] }): [Drob, Drob] {
  const [x, y] = rng.sample(SHARES, 2).map((s) => D(s)) as [Drob, Drob];
  return x.gt(y) ? [x, y] : [y, x];
}

/** Выплаты таблицы долей на единицу S (через солвер). */
const shareRows = (a: Drob, b: Drob, r: Drob) => byDebts(1, [a, b, 0], r);

/** Выплаты по формуле: (k − a)S, (ka − b)S, kbS. */
const sharePays = (a: Drob, b: Drob, k: Drob): Drob[] => [k.sub(a), k.mul(a).sub(b), k.mul(b)];

function lcm(xs: bigint[]): bigint {
  const g = (p: bigint, q: bigint): bigint => (q === 0n ? p : g(q, p % q));
  return xs.reduce((acc, x) => (acc * x) / g(acc, x), 1n);
}

function sharesStem(
  plot: { subject: string; goal: string; year: number },
  r: Drob,
  unitWord: string,
  extra: string,
): string {
  return (
    `В июле ${plot.year} года ${plot.subject} планирует взять кредит ${plot.goal} на три года в размере $S$ ${unitWord}, где $S$ — ${extra}. Условия его возврата таковы:\n` +
    `— каждый январь долг увеличивается на ${pct(r)} по сравнению с концом предыдущего года;\n` +
    `— с февраля по июнь каждого года необходимо выплатить одним платежом часть долга;\n` +
    `— в июле каждого года долг должен составлять часть кредита в соответствии с таблицей.`
  );
}

/** Таблица долей в буквах: долг на июль S, aS, bS, 0; платежи x_1, x_2, x_3. */
const TABLITSA_DOLEY: TablitsaPeremennye = {
  podpis: 'Доли из таблицы условия: долг на июль — $S$, $aS$, $bS$, $0$',
  period: 'year',
  scheme: 'ann',
  rows: [
    { label: '1', cells: ['S', 'Sk', 'x_{1}', 'aS'] },
    { label: '2', cells: ['aS', 'aS\\,k', 'x_{2}', 'bS'] },
    { label: '3', cells: ['bS', 'bS\\,k', 'x_{3}', '0'] },
  ],
  itog: null,
  strelka: null,
};

/** Таблица и платежи через S — в буквах (числа — в sharesChisla). */
function sharesSolution() {
  return [
    stTablitsaBukvy(
      'Долг на июль задан таблицей условия: $S$, $aS$, $bS$ и $0$, где $a$ и $b$ — доли кредита. Каждый январь долг умножается на $k = 1 + \\dfrac{r}{100}$; платёж года — долг после начисления минус долг на июль.',
      TABLITSA_DOLEY,
    ),
    {
      title: 'Выражаем платежи через $S$',
      text: 'Из каждой строки таблицы: платёж = долг после начисления − долг на конец.',
      bloki: [
        { vid: 'formula' as const, tex: 'x_{1} = Sk - aS = (k - a)\\,S' },
        { vid: 'formula' as const, tex: 'x_{2} = aSk - bS = (ak - b)\\,S' },
        { vid: 'formula' as const, tex: 'x_{3} = bSk = bk\\,S' },
      ],
    },
  ];
}

/** Коэффициенты платежей числами: k, k − a, ak − b, bk. */
function sharesChisla(a: Drob, b: Drob, r: Drob, posle?: string) {
  const k = kOf(r);
  const [z1, z2, z3] = sharePays(a, b, k) as [Drob, Drob, Drob];
  return stChisla(
    `$r = ${tex(r)}$, $a = ${tex(a)}$, $b = ${tex(b)}$.`,
    [
      `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}`,
      `x_{1} = (${tex(k)} - ${tex(a)})\\,S = ${tex(z1)}S,\\quad x_{2} = (${tex(a)}\\cdot ${tex(k)} - ${tex(b)})\\,S = ${tex(z2)}S,\\quad x_{3} = ${tex(b)}\\cdot ${tex(k)}\\,S = ${tex(z3)}S`,
    ],
    posle,
  );
}

/* ── Б3: таблица долей и целое S ─────────────────────────────── */

const B01: Prototype = {
  id: 'B-01',
  type: 'B',
  subtype: 'Б3',
  source: 'fipi',
  difficulty: 'hard',
  units: 'thous',
  title: 'Таблица долей: наименьшее $S$, при котором выплаты — целые тысячи',
  forbid: [
    { r: 15, a: 70, b: 40 },
    { r: 15, a: 75, b: 40 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(['5', '10', '15', '20', '25', '30']));
    const [a, b] = pickShares(rng);
    const k = kOf(r);
    const pays = sharePays(a, b, k);
    if (!pays.every((z) => z.isPositive())) return null;
    const L = lcm(pays.map((z) => z.d));
    if (L < 20n || L > 2000n) return null;
    let found = 0;
    const unit = shareRows(a, b, r);
    for (let S = 1; S <= 4000 && !found; S++)
      if (unit.every((row) => row.payment.mul(S).isInteger())) found = S;
    const tbl = julyTable(plot.year, [D(1), a, b, D(0)], 'тыс. рублей');
    const [z1, z2, z3] = pays as [Drob, Drob, Drob];
    return {
      condition: `${sharesStem(plot, r, 'тыс. рублей', 'натуральное число')}\nНайдите наименьшее значение $S$, при котором каждая из выплат будет составлять целое число тысяч рублей.`,
      conditionTable: tbl,
      answer: D(L),
      verify: D(found),
      params: { r: r.toNumber(), a: a.mul(100).toNumber(), b: b.mul(100).toNumber() },
      rows: byDebts(D(L), [a.mul(L), b.mul(L), 0], r),
      scheme: 'dif',
      period: 'year',
      solution: [
        ...sharesSolution(),
        step(
          'Когда платежи целые',
          'Каждый коэффициент запишем несократимой дробью $\\dfrac{p}{q}$. Платёж $\\dfrac{p}{q}\\,S$ целый, только если $S$ делится на $q$: $p$ и $q$ взаимно просты.',
        ),
        stFormula(
          'Наименьшее $S$, которое делится на все три знаменателя, — их наименьшее общее кратное; $q_{1}$, $q_{2}$, $q_{3}$ — знаменатели несократимых дробей $k - a$, $ak - b$ и $bk$.',
          'S = \\text{НОК}(q_{1}, q_{2}, q_{3})',
        ),
        sharesChisla(a, b, r),
        step(
          'Знаменатели и НОК',
          'Записываем коэффициенты несократимыми дробями.',
          `${tex(z1)} = \\frac{${z1.n}}{${z1.d}},\\quad ${tex(z2)} = \\frac{${z2.n}}{${z2.d}},\\quad ${tex(z3)} = \\frac{${z3.n}}{${z3.d}} \\;\\Rightarrow\\; S = \\text{НОК}(${z1.d}, ${z2.d}, ${z3.d}) = ${L}`,
        ),
        stAnswer(`Наименьшее $S = ${L}$ (тыс. рублей).`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Что должно делиться на знаменатели дробей?',
          'Сумма кредита $S$',
          ['Ставка $r$', 'Каждая выплата'],
          rng.int(0, 2),
          'Выплата — это дробь, умноженная на $S$; чтобы она была целой, $S$ делится на знаменатель.',
        ),
      ],
    };
  },
};

function makeShareBound(id: 'B-02' | 'B-03'): Prototype {
  const isMin = id === 'B-02';
  return {
    id,
    type: 'B',
    subtype: 'Б3',
    source: 'fipi',
    sourceNote: isMin ? 'по задаче ЕГЭ-2019' : 'по задаче ЕГЭ-2016',
    difficulty: 'hard',
    units: 'mln',
    title: isMin
      ? 'Таблица долей: наименьшее целое $S$, при котором каждая выплата больше $N$'
      : 'Таблица долей: наибольшее целое $S$, при котором разница выплат меньше $N$',
    forbid: isMin ? [{ r: 30, a: 70, b: 30, N: 30 }] : [{ r: 25, a: 70, b: 40, N: 10 }],
    make({ rng, plot }) {
      const r = D(rng.pick(['10', '15', '20', '25', '30']));
      const [a, b] = pickShares(rng);
      const k = kOf(r);
      const pays = sharePays(a, b, k);
      if (!pays.every((z) => z.isPositive())) return null;
      const lo = pays.reduce((m, z) => (z.lt(m) ? z : m));
      const hi = pays.reduce((m, z) => (z.gt(m) ? z : m));
      const spread = hi.sub(lo);
      if (spread.eq(0)) return null;
      const S0 = rng.int(4, 30);
      const unit = shareRows(a, b, r);
      let N: Drob;
      let found: number | null;
      if (isMin) {
        // каждая выплата больше N: lo·S > N; граница между S0 − 1 и S0
        N = D(lo.mul(S0).mul(10).ceil() - 1n).div(10);
        if (!N.gt(lo.mul(S0 - 1)) && !N.eq(lo.mul(S0 - 1))) return null;
        if (!lo.mul(S0).gt(N) || !N.isPositive()) return null;
        found = smallestInt((S) => unit.every((row) => row.payment.mul(S).gt(N)), 1, 400);
      } else {
        // разница меньше N: spread·S < N; граница между S0 и S0 + 1
        N = D(spread.mul(S0).mul(10).floor() + 1n).div(10);
        if (N.gt(spread.mul(S0 + 1))) return null;
        found = largestInt(
          (S) => {
            const ps = unit.map((row) => row.payment.mul(S));
            const mx = ps.reduce((m, z) => (z.gt(m) ? z : m));
            const mn = ps.reduce((m, z) => (z.lt(m) ? z : m));
            return mx.sub(mn).lt(N);
          },
          1,
          400,
        );
      }
      if (found === null) return null;
      const tbl = julyTable(plot.year, [D(1), a, b, D(0)], 'млн рублей');
      const ask = isMin
        ? `Найдите наименьшее значение $S$, при котором каждая из выплат будет больше ${money(N, 'mln')}.`
        : `Найдите наибольшее значение $S$, при котором разница между наибольшей и наименьшей выплатами будет меньше ${money(N, 'mln')}.`;
      return {
        condition: `${sharesStem(plot, r, 'млн рублей', 'целое число')}\n${ask}`,
        conditionTable: tbl,
        answer: D(S0),
        verify: D(found),
        params: {
          r: r.toNumber(),
          a: a.mul(100).toNumber(),
          b: b.mul(100).toNumber(),
          N: N.mul(10).toNumber(),
        },
        rows: byDebts(S0, [a.mul(S0), b.mul(S0), 0], r),
        scheme: 'dif',
        period: 'year',
        solution: [
          ...sharesSolution(),
          sharesChisla(a, b, r),
          isMin
            ? step(
                'Составляем неравенство',
                'Если наименьшая выплата больше $N$, то и все остальные больше.',
                `${tex(lo)}S > ${tex(N)} \\;\\Rightarrow\\; S > \\frac{${tex(N)}}{${tex(lo)}}`,
              )
            : step(
                'Составляем неравенство',
                'Разница наибольшей и наименьшей выплат — тоже часть $S$.',
                `(${tex(hi)} - ${tex(lo)})S < ${tex(N)} \\;\\Rightarrow\\; ${tex(spread)}S < ${tex(N)}`,
              ),
          step(
            'Выбираем целое',
            isMin
              ? `Правая часть больше ${S0 - 1}, но меньше ${S0}. Наименьшее целое — ${S0}; при $S = ${S0 - 1}$ наименьшая выплата не больше ${num(N)} млн.`
              : `Правая часть больше ${S0}, но не больше ${S0 + 1}. Наибольшее целое — ${S0}; при $S = ${S0 + 1}$ разница уже не меньше ${num(N)} млн.`,
          ),
          stAnswer(`$S = ${S0}$ (млн рублей).`),
        ],
        hints: [
          hintType('B', rng.int(0, 2)),
          isMin
            ? choice(
                'Какую выплату достаточно сравнить с $N$?',
                'Наименьшую',
                ['Первую', 'Наибольшую'],
                rng.int(0, 2),
                'Если наименьшая больше $N$, то больше и все остальные.',
              )
            : choice(
                'Что сравниваем с $N$?',
                'Разность наибольшей и наименьшей выплат',
                ['Первую выплату', 'Сумму всех выплат'],
                rng.int(0, 2),
              ),
        ],
      };
    },
  };
}

/* ── Б2: уменьшение на X и остаток одним платежом ─────────────── */

function fixedRows(S: Drob, X: Drob, n: number, r: Drob) {
  return byDebts(S, fixedEnds(S, X, n - 1), r);
}

/** «Уменьшение на X и остаток» в буквах: строки 1, 2, 3, …, n − 1, n. */
const TABLITSA_FIXED: TablitsaPeremennye = (() => {
  const rT = '\\dfrac{r}{100}';
  const dolg = (m: string) => `S - ${m}`;
  const stroka = (label: string, m: string, m1: string) => ({
    label,
    cells: [dolg(m), 'X', `${rT}\\cdot (${dolg(m)})`, dolg(m1)] as [string, string, string, string],
  });
  return {
    podpis: '',
    period: 'month' as const,
    scheme: 'dif' as const,
    rows: [
      {
        label: '1',
        cells: ['S', 'X', `${rT}\\cdot S`, 'S - X'] as [string, string, string, string],
      },
      stroka('2', 'X', '2X'),
      stroka('3', '2X', '3X'),
      null,
      stroka('n-1', '(n-2)X', '(n-1)X'),
      {
        label: 'n',
        cells: ['S - (n-1)X', 'S - (n-1)X', `${rT}\\cdot (S - (n-1)X)`, '0'] as [
          string,
          string,
          string,
          string,
        ],
      },
    ],
    itog: ['S', 'P'],
    strelka: '$r\\,\\%$ начисляется на долг на начало месяца',
  };
})();

function makeFixed(id: 'B-04' | 'B-05'): Prototype {
  const askDebt = id === 'B-04';
  return {
    id,
    type: 'B',
    subtype: 'Б2',
    source: 'fipi',
    ...(askDebt ? { sourceNote: 'по задаче ЕГЭ-2018' } : {}),
    difficulty: 'base',
    units: askDebt ? 'thous' : 'rub',
    title: askDebt
      ? 'Уменьшение на X и остаток: долг на предпоследний месяц'
      : 'Уменьшение на X и остаток: сумма кредита',
    forbid: askDebt
      ? [
          { n: 26, r: 3, X: 20, Z: 1407 },
          { n: 21, r: 2, X: 6, Z: 187.8 },
          { n: 11, r: 3, X: 80, Z: 1198 },
          { n: 19, r: 2, X: 50, Z: 1209 },
          { n: 13, r: 2, X: 30, Z: 709.2 },
        ]
      : [{ n: 21, r: 3, X: 30, Z: 1604 }],
    make({ rng, plot }) {
      const n = rng.int(10, 30);
      const r = D(rng.pick(['1', '2', '3', '4']));
      const X = D(rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 80]));
      const d = D(rng.int(2, 60) * 10); // долг на 15-е число (n−1)-го месяца, тыс.
      const S = d.add(X.mul(n - 1));
      const tri = ((n - 1) * n) / 2;
      const Z = S.add(r.div(100).mul(S.mul(n).sub(X.mul(tri))));
      if (!isNice(Z, 1) || S.gt(4000)) return null;
      const Sfound = solveLinear((s) => totalPaid(fixedRows(s, X, n, r)), Z);
      const answer = askDebt ? d : S.mul(1000);
      const verify = askDebt ? Sfound.sub(X.mul(n - 1)) : Sfound.mul(1000);
      const ask = askDebt
        ? `Какой долг будет 15-го числа ${n - 1}-го месяца, если общая сумма выплат после полного погашения кредита составит ${money(Z, 'thous')}? Ответ выразите в тысячах рублей.`
        : `Какую сумму планируется взять в кредит, если общая сумма выплат после полного погашения кредита составит ${money(Z, 'thous')}? Ответ выразите в рублях.`;
      return {
        condition: `${frameFixed(plot.subject, plot.goal, rng.int(0, 11), n, pct(r), X)}\n${ask}`,
        answer,
        verify,
        params: { n, r: r.toNumber(), X: X.toNumber(), Z: Z.toNumber() },
        rows: fixedRows(S, X, n, r),
        scheme: 'dif',
        period: 'month',
        extra: [n - 1],
        solution: [
          stTablitsaBukvy(
            'Считаем в тысячах рублей. Первые $n - 1$ месяцев долг уменьшается на одну и ту же сумму $X$, в последний месяц гасится весь остаток. Переплата — $r\\,\\%$ от долга на начало месяца.',
            TABLITSA_FIXED,
          ),
          step(
            'Составляем уравнение',
            'Долг уменьшился с $S$ до нуля, поэтому столбец «Сумма изменения долга» в сумме даёт $S$. Вся сумма выплат $Z$ — кредит плюс переплата $P$, а переплата — $\\dfrac{r}{100}$ от суммы долгов на начало месяцев.',
            'Z = S + P, \\qquad P = \\dfrac{r}{100}\\big(S + (S - X) + \\dots + (S - (n-1)X)\\big)',
          ),
          step(
            'Складываем долги на начало',
            '$n$ слагаемых по $S$; вычитаемые — $X$, умноженное на арифметическую прогрессию $1 + 2 + \\dots + (n - 1)$.',
            'S + (S - X) + \\dots + (S - (n-1)X) = nS - X\\,(1 + 2 + \\dots + (n-1)) = nS - \\dfrac{n(n-1)}{2}\\,X',
          ),
          step(
            'Подставляем в уравнение и собираем $S$',
            'Слагаемые с $S$ — в левую часть.',
            'Z = S + \\dfrac{r}{100}\\Big(nS - \\dfrac{n(n-1)}{2}\\,X\\Big) \\;\\Rightarrow\\; S\\Big(1 + \\dfrac{rn}{100}\\Big) = Z + \\dfrac{r}{100}\\cdot\\dfrac{n(n-1)}{2}\\,X',
          ),
          stFormula(
            askDebt
              ? 'Делим на скобку; долг на 15-е число $(n - 1)$-го месяца — кредит минус $n - 1$ уменьшений.'
              : 'Делим на скобку.',
            askDebt
              ? 'S = \\dfrac{Z + \\dfrac{r}{100}\\cdot\\dfrac{n(n-1)}{2}\\,X}{1 + \\dfrac{rn}{100}}, \\qquad D_{n-1} = S - (n-1)X'
              : 'S = \\dfrac{Z + \\dfrac{r}{100}\\cdot\\dfrac{n(n-1)}{2}\\,X}{1 + \\dfrac{rn}{100}}',
          ),
          stChisla(`$n = ${n}$, $r = ${tex(r)}$, $X = ${tex(X)}$, $Z = ${tex(Z)}$.`, [
            `\\dfrac{n(n-1)}{2} = \\dfrac{${n}\\cdot ${n - 1}}{2} = ${tri}`,
            `S = \\dfrac{${tex(Z)} + \\dfrac{${tex(r)}}{100}\\cdot ${tri}\\cdot ${tex(X)}}{1 + \\dfrac{${tex(r)}\\cdot ${n}}{100}} = \\dfrac{${tex(Z.add(r.div(100).mul(X).mul(tri)))}}{${tex(r.mul(n).div(100).add(1))}} = ${tex(S)}`,
            askDebt
              ? `D_{${n - 1}} = ${tex(S)} - ${n - 1}\\cdot ${tex(X)} = ${tex(d)}`
              : `${tex(S)}\\ \\text{тыс.} = ${tex(S.mul(1000))}\\ \\text{руб.}`,
          ]),
          stAnswer(
            askDebt
              ? `Долг составит ${money(d, 'thous')}.`
              : `В кредит планируется взять ${money(S.mul(1000), 'rub')}.`,
          ),
        ],
        hints: [
          hintType('B', rng.int(0, 2)),
          hintChangeSum(rng.int(0, 2)),
          choice(
            'Сколько месяцев долг уменьшается на одну и ту же сумму?',
            `${n - 1}: последний месяц гасится остаток`,
            [`${n}: весь срок`, `${n - 2}`],
            rng.int(0, 2),
          ),
        ],
      };
    },
  };
}

const B06: Prototype = {
  id: 'B-06',
  type: 'B',
  subtype: 'Б2',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2018',
  difficulty: 'base',
  units: 'thous',
  title: 'Известен долг на предпоследний месяц — найти сумму выплат',
  forbid: [{ S: 300, n: 21, r: 2, D: 100 }],
  make({ rng, plot }) {
    const n = rng.int(8, 30);
    const r = D(rng.pick(['1', '2', '3', '4']));
    const X = D(rng.pick([5, 10, 15, 20, 25, 30, 40, 50]));
    const d = D(rng.int(1, 40) * 10);
    const S = d.add(X.mul(n - 1));
    const Z = S.add(r.div(100).mul(n).mul(S.add(d)).div(2));
    if (!isNice(Z, 1) || S.gt(3000)) return null;
    const rows = fixedRows(S, X, n, r);
    const month = rng.int(0, 11);
    return {
      condition:
        `15-го ${MONTHS_GEN[month]} ${plot.subject} планирует взять кредит ${plot.goal} на сумму ${money(S, 'thous')} на ${months(n)}. Условия его возврата таковы:\n` +
        `— 1-го числа каждого месяца долг возрастает на ${pct(r)} по сравнению с концом предыдущего месяца;\n` +
        `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
        `— 15-го числа каждого месяца с 1-го по ${n - 1}-й долг должен быть на одну и ту же сумму меньше долга на 15-е число предыдущего месяца;\n` +
        `— 15-го числа ${n - 1}-го месяца долг составит ${money(d, 'thous')};\n` +
        `— к 15-му числу ${n}-го месяца кредит должен быть полностью погашен.\n` +
        `Найдите общую сумму выплат после полного погашения кредита. Ответ выразите в тысячах рублей.`,
      answer: Z,
      verify: totalPaid(rows),
      params: { S: S.toNumber(), n, r: r.toNumber(), D: d.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [n - 1],
      solution: [
        stTable(
          `Долги на начало месяцев: $${tex(S)}$, затем на одну и ту же сумму меньше, …, в последний месяц — $${tex(d)}$. Это ${n} членов арифметической прогрессии.`,
        ),
        stChangeSum(),
        step(
          'Сумма долгов на начало',
          'Сумма прогрессии — полусумма первого и последнего, умноженная на число членов.',
          `\\frac{${tex(S)} + ${tex(d)}}{2}\\cdot ${n} = ${tex(S.add(d).mul(n).div(2))}`,
        ),
        step(
          'Переплата и сумма выплат',
          `Переплата — ${num(r)} % от суммы долгов.`,
          `${tex(S)} + \\frac{${tex(r)}}{100}\\cdot ${tex(S.add(d).mul(n).div(2))} = ${tex(Z)}`,
        ),
        stAnswer(`Общая сумма выплат — ${money(Z, 'thous')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Как сложить долги на начало месяцев?',
          'Полусумма первого и последнего, умноженная на число месяцев',
          [
            'Первый долг, умноженный на число месяцев',
            'Последний долг, умноженный на число месяцев',
          ],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/** Рамка «на (n+1) месяц» с долгом D на n-й месяц. */
function frameNplus1(
  subject: string,
  goal: string,
  month: number,
  S: Drob,
  r: string,
  decrease: string,
  d: Drob,
): string {
  return (
    `15-го ${MONTHS_GEN[month]} ${subject} планирует взять кредит ${goal} на сумму ${money(S, 'thous')} на $(n+1)$ месяц. Условия его возврата таковы:\n` +
    `— 1-го числа каждого месяца долг возрастает на ${r} по сравнению с концом предыдущего месяца;\n` +
    `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
    `— 15-го числа каждого месяца с 1-го по $n$-й долг должен быть ${decrease} меньше долга на 15-е число предыдущего месяца;\n` +
    `— 15-го числа $n$-го месяца долг составит ${money(d, 'thous')};\n` +
    `— к 15-му числу $(n+1)$-го месяца кредит должен быть полностью погашен.`
  );
}

const B07: Prototype = {
  id: 'B-07',
  type: 'B',
  subtype: 'Б2',
  source: 'fipi',
  difficulty: 'hard',
  units: 'percent',
  title: 'Срок $(n+1)$ месяц, известен долг $n$-го месяца — найти ставку',
  forbid: [
    { S: 900, X: 20, D: 300, Z: 1272 },
    { S: 1200, X: 80, D: 400, Z: 1288 },
  ],
  make({ rng, plot }) {
    const X = D(rng.pick([10, 20, 25, 30, 40, 50]));
    const n = rng.int(5, 30);
    const d = D(rng.int(5, 40) * 10);
    const S = d.add(X.mul(n));
    const r = D(rng.pick(['1', '2', '3', '4', '5']));
    const starts = S.add(d)
      .mul(n + 1)
      .div(2);
    const Z = S.add(r.div(100).mul(starts));
    if (!isNice(Z, 1) || S.gt(3000)) return null;
    let found: Drob = D(0);
    for (let x = 1; x <= 40; x++) {
      const rr = D(x, 2);
      if (totalPaid(byDebts(S, fixedEnds(S, X, n), rr)).eq(Z)) found = rr;
    }
    return {
      condition: `${frameNplus1(plot.subject, plot.goal, rng.int(0, 11), S, '$r$ %', `на ${money(X, 'thous')}`, d)}\nНайдите $r$, если известно, что общая сумма выплат после полного погашения кредита составит ${money(Z, 'thous')}.`,
      answer: r,
      verify: found,
      params: { S: S.toNumber(), X: X.toNumber(), D: d.toNumber(), Z: Z.toNumber() },
      rows: byDebts(S, fixedEnds(S, X, n), r),
      scheme: 'dif',
      period: 'month',
      extra: [n],
      solution: [
        step(
          'Находим $n$',
          `Долг уменьшился с ${num(S)} до ${num(d)} тыс. ступеньками по ${num(X)} тыс.`,
          `n = \\frac{${tex(S)} - ${tex(d)}}{${tex(X)}} = ${n}`,
        ),
        stTable(
          `Долги на начало месяцев: $${tex(S)}, ${tex(S.sub(X))}, \\dots, ${tex(d)}$ — это ${n + 1} членов арифметической прогрессии.`,
        ),
        stChangeSum(),
        step(
          'Сумма долгов на начало',
          'Полусумма первого и последнего, умноженная на число членов.',
          `\\frac{${tex(S)} + ${tex(d)}}{2}\\cdot ${n + 1} = ${tex(starts)}`,
        ),
        step(
          'Находим $r$',
          'Переплата — разность суммы выплат и кредита.',
          `\\frac{r}{100}\\cdot ${tex(starts)} = ${tex(Z)} - ${tex(S)} \\;\\Rightarrow\\; r = ${tex(r)}`,
        ),
        stAnswer(`$r = ${tex(r)}$.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Сколько всего месяцев кредит?',
          '$n + 1$: последний месяц гасится остаток',
          ['$n$', '$n - 1$'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B08: Prototype = {
  id: 'B-08',
  type: 'B',
  subtype: 'Б2',
  source: 'fipi',
  difficulty: 'hard',
  units: 'months',
  title: 'Срок $(n+1)$ месяц, известен долг $n$-го месяца — найти $n$',
  forbid: [
    { S: 700, r: 1, D: 300, Z: 755 },
    { S: 600, r: 3, D: 200, Z: 852 },
  ],
  make({ rng, plot }) {
    const n = rng.int(5, 30);
    const X = D(rng.pick([5, 10, 20, 25, 30, 40]));
    const d = D(rng.int(5, 40) * 10);
    const S = d.add(X.mul(n));
    const r = D(rng.pick(['1', '2', '3', '4']));
    const Z = S.add(
      r
        .div(100)
        .mul(S.add(d))
        .mul(n + 1)
        .div(2),
    );
    if (!isNice(Z, 1) || S.gt(3000)) return null;
    let found = 0;
    for (let k = 1; k <= 100; k++)
      if (totalPaid(byDebts(S, fixedEnds(S, S.sub(d).div(k), k), r)).eq(Z)) found = k;
    return {
      condition: `${frameNplus1(plot.subject, plot.goal, rng.int(0, 11), S, pct(r), 'на одну и ту же сумму', d)}\nНайдите $n$, если известно, что общая сумма выплат после полного погашения кредита составит ${money(Z, 'thous')}.`,
      answer: D(n),
      verify: D(found),
      params: { S: S.toNumber(), r: r.toNumber(), D: d.toNumber(), Z: Z.toNumber() },
      rows: byDebts(S, fixedEnds(S, X, n), r),
      scheme: 'dif',
      period: 'month',
      extra: [n],
      solution: [
        stTable(
          `Долги на начало месяцев: от $${tex(S)}$ до $${tex(d)}$ с одинаковым шагом — это $n + 1$ членов арифметической прогрессии.`,
        ),
        stChangeSum(),
        step(
          'Сумма долгов на начало',
          'Полусумма первого и последнего, умноженная на число членов.',
          `\\frac{${tex(S)} + ${tex(d)}}{2}\\,(n + 1) = ${tex(S.add(d).div(2))}\\,(n+1)`,
        ),
        step(
          'Составляем уравнение',
          'Кредит плюс переплата равны сумме выплат.',
          `${tex(S)} + \\frac{${tex(r)}}{100}\\cdot ${tex(S.add(d).div(2))}\\,(n+1) = ${tex(Z)} \\;\\Rightarrow\\; n + 1 = ${n + 1}`,
        ),
        stAnswer(`$n = ${n}$.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Сколько слагаемых в сумме долгов на начало?',
          '$n + 1$',
          ['$n$', '$n + 2$'],
          rng.int(0, 2),
          'Долг на начало есть у каждого из $n + 1$ месяцев.',
        ),
      ],
    };
  },
};

/* ── Б1: две ставки ───────────────────────────────────────────── */

function twoRatesText(
  plot: { subject: string; goal: string; year: number },
  S: Drob,
  m: number,
  r1: string,
  r2: string,
): string {
  const y = plot.year;
  return (
    `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
    `— в январе ${yearList(y + 1, m)} годов долг возрастает на ${r1} по сравнению с концом предыдущего года;\n` +
    `— в январе ${yearList(y + m + 1, m)} годов долг возрастает на ${r2} по сравнению с концом предыдущего года;\n` +
    `— в июле каждого года долг должен быть на одну и ту же величину меньше долга на июль предыдущего года;\n` +
    `— к июлю ${y + 2 * m} года долг должен быть полностью погашен.`
  );
}

/** Сумма долгов на начало по двум кускам: первые m лет и последние m лет. */
function twoRateSums(S: Drob, m: number) {
  const n = 2 * m;
  const firstK = ((n + m + 1) * m) / 2; // n + (n−1) + … + (m+1)
  const secondK = ((m + 1) * m) / 2; // m + … + 1
  return { first: S.div(n).mul(firstK), second: S.div(n).mul(secondK), firstK, secondK, n };
}

/** Две ставки в буквах: строки 1, …, m, m + 1, …, n (n = 2m). */
const TABLITSA_DVE_STAVKI: TablitsaPeremennye = (() => {
  const d = (c: string) => (c === 'n' ? 'S' : c === '0' ? '0' : `\\dfrac{${c}S}{n}`);
  const stroka = (label: string, c: string, c1: string, r: string) => ({
    label,
    cells: [d(c), '\\dfrac{S}{n}', `\\dfrac{${r}}{100}\\cdot ${d(c)}`, d(c1)] as [
      string,
      string,
      string,
      string,
    ],
  });
  return {
    podpis: 'Первые $m$ лет ставка $r_{1}\\,\\%$, последние $m$ лет — $r_{2}\\,\\%$; $n = 2m$',
    period: 'year' as const,
    scheme: 'dif' as const,
    rows: [
      stroka('1', 'n', '(n-1)', 'r_{1}'),
      null,
      stroka('m', '(n-m+1)', '(n-m)', 'r_{1}'),
      stroka('m+1', '(n-m)', '(n-m-1)', 'r_{2}'),
      null,
      {
        label: 'n',
        cells: ['\\dfrac{S}{n}', '\\dfrac{S}{n}', '\\dfrac{r_{2}}{100}\\cdot \\dfrac{S}{n}', '0'],
      },
    ],
    itog: ['S', 'P'],
    strelka: 'проценты начисляются на долг на начало года',
  };
})();

/** Таблица, уравнение и суммы прогрессий — в буквах (числа — у прототипа). */
function twoRateSteps() {
  return [
    stTablitsaBukvy(
      'Долг каждый год уменьшается на одну и ту же сумму $\\dfrac{S}{n}$. Долг на начало года — $n$, $n - 1$, …, $1$ таких частей. Переплата года — ставка этого года от долга на начало.',
      TABLITSA_DVE_STAVKI,
    ),
    step(
      'Составляем уравнение',
      'Долг уменьшился с $S$ до нуля, поэтому столбец «Сумма изменения долга» в сумме даёт $S$. Вся сумма выплат $Z$ — кредит плюс переплата $P$; переплату считаем по двум кускам срока.',
      'Z = S + \\dfrac{r_{1}}{100}\\cdot\\dfrac{S}{n}\\big(n + (n-1) + \\dots + (m+1)\\big) + \\dfrac{r_{2}}{100}\\cdot\\dfrac{S}{n}\\big(m + \\dots + 1\\big)',
    ),
    step(
      'Складываем прогрессии',
      'В каждой скобке — $m$ членов арифметической прогрессии: полусумма первого и последнего, умноженная на число членов.',
      'n + \\dots + (m+1) = \\dfrac{(n+m+1)\\,m}{2}, \\qquad m + \\dots + 1 = \\dfrac{(m+1)\\,m}{2}',
    ),
  ];
}

/** Подстановка чисел для двух ставок: n, суммы прогрессий, S/n. */
const dveStavkiChisla = (S: Drob, m: number, r1: string, r2: string) => {
  const { firstK, secondK, n } = twoRateSums(S, m);
  return [
    `n = 2\\cdot ${m} = ${n}, \\qquad \\dfrac{(n+m+1)\\,m}{2} = ${firstK}, \\qquad \\dfrac{(m+1)\\,m}{2} = ${secondK}, \\qquad \\dfrac{S}{n} = ${tex(S.div(n))}`,
    `$S = ${tex(S)}$, $m = ${m}$, $r_{1} = ${r1}$${r2 ? `, $r_{2} = ${r2}$` : ''}.`,
  ] as const;
};

const B09: Prototype = {
  id: 'B-09',
  type: 'B',
  subtype: 'Б1',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2022',
  difficulty: 'base',
  units: 'percent',
  title: 'Две ставки: найти вторую ставку по сумме выплат',
  forbid: [
    { S: 2500, m: 5, r1: 12, Z: 4000 },
    { S: 600, m: 3, r1: 20, Z: 984 },
    { S: 1200, m: 3, r1: 10, Z: 1680 },
  ],
  make({ rng, plot }) {
    const m = rng.pick([3, 4, 5]);
    const S = D(rng.int(3, 40) * 100);
    const r1 = D(rng.pick(['8', '10', '12', '15', '20']));
    const r = D(rng.pick(['6', '8', '10', '12', '14', '15', '16', '18', '20']));
    if (r.eq(r1)) return null;
    const { first, second, n, firstK, secondK } = twoRateSums(S, m);
    const Z = S.add(r1.div(100).mul(first)).add(r.div(100).mul(second));
    if (!isNice(Z, 1) || !isNice(S.div(n), 2)) return null;
    const chisla9 = dveStavkiChisla(S, m, tex(r1), '');
    let found: Drob = D(0);
    for (let x = 1; x <= 60; x++) {
      const rates = [...Array(m).fill(r1), ...Array(m).fill(D(x))] as Drob[];
      if (totalPaid(differentiated(S, n, rates)).eq(Z)) found = D(x);
    }
    const rates = [...Array(m).fill(r1), ...Array(m).fill(r)] as Drob[];
    return {
      condition: `${twoRatesText(plot, S, m, pct(r1), '$r$ %')}\nЧему равно $r$, если общая сумма выплат составит ${money(Z, 'thous')}?`,
      answer: r,
      verify: found,
      params: { S: S.toNumber(), m, r1: r1.toNumber(), Z: Z.toNumber() },
      rows: differentiated(S, n, rates),
      scheme: 'dif',
      period: 'year',
      solution: [
        ...twoRateSteps(),
        stFormula(
          'Выражаем $r_{2}$ — это и есть $r$: умножаем уравнение на $\\dfrac{100n}{S}$ и переносим известное вправо.',
          'r = r_{2} = \\dfrac{\\dfrac{200n\\,(Z - S)}{S} - r_{1}(n+m+1)\\,m}{m(m+1)}',
        ),
        stChisla(`${chisla9[1]} $Z = ${tex(Z)}$.`, [
          chisla9[0],
          `r = \\dfrac{\\dfrac{200\\cdot ${n}\\cdot (${tex(Z)} - ${tex(S)})}{${tex(S)}} - ${tex(r1)}\\cdot ${2 * firstK}}{${2 * secondK}} = \\dfrac{${tex(
            D(200 * n)
              .mul(Z.sub(S))
              .div(S),
          )} - ${tex(r1.mul(2 * firstK))}}{${2 * secondK}} = ${tex(r)}`,
        ]),
        stAnswer(`$r = ${tex(r)}$.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Как считать переплату при двух ставках?',
          'Отдельно по каждому куску срока со своей ставкой',
          ['Взять среднюю ставку на весь срок', 'Сложить ставки'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B10: Prototype = {
  id: 'B-10',
  type: 'B',
  subtype: 'Б1',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'Две ставки: общая сумма выплат',
  forbid: [
    { S: 800, m: 4, r1: 10, r2: 15 },
    { S: 600, m: 5, r1: 13, r2: 12 },
  ],
  make({ rng, plot }) {
    const m = rng.pick([3, 4, 5]);
    const S = D(rng.int(3, 40) * 100);
    const r1 = D(rng.pick(['8', '10', '12', '14', '15', '20']));
    const r2 = D(rng.pick(['6', '9', '10', '11', '12', '15', '16', '18']));
    if (r2.eq(r1)) return null;
    const { first, second, n, firstK, secondK } = twoRateSums(S, m);
    const Z = S.add(r1.div(100).mul(first)).add(r2.div(100).mul(second));
    if (!isNice(Z, 1) || !isNice(S.div(n), 2)) return null;
    const rates = [...Array(m).fill(r1), ...Array(m).fill(r2)] as Drob[];
    const rows = differentiated(S, n, rates);
    return {
      condition: `${twoRatesText(plot, S, m, pct(r1), pct(r2))}\nЧему равна общая сумма выплат? Ответ выразите в тысячах рублей.`,
      answer: Z,
      verify: totalPaid(rows),
      params: { S: S.toNumber(), m, r1: r1.toNumber(), r2: r2.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        ...twoRateSteps(),
        stFormula(
          'Подставляем суммы прогрессий в уравнение.',
          'Z = S + \\dfrac{S}{n}\\Big(\\dfrac{r_{1}}{100}\\cdot\\dfrac{(n+m+1)\\,m}{2} + \\dfrac{r_{2}}{100}\\cdot\\dfrac{(m+1)\\,m}{2}\\Big)',
        ),
        stChisla(dveStavkiChisla(S, m, tex(r1), tex(r2))[1], [
          dveStavkiChisla(S, m, tex(r1), tex(r2))[0],
          `Z = ${tex(S)} + ${tex(S.div(n))}\\cdot\\Big(\\dfrac{${tex(r1)}}{100}\\cdot ${firstK} + \\dfrac{${tex(r2)}}{100}\\cdot ${secondK}\\Big) = ${tex(S)} + ${tex(r1.div(100).mul(first))} + ${tex(r2.div(100).mul(second))} = ${tex(Z)}`,
        ]),
        stAnswer(`Общая сумма выплат — ${money(Z, 'thous')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Какие долги на начало у последних лет?',
          `От ${m} до 1 части $\\dfrac{S}{${2 * m}}$`,
          [`От ${2 * m} до ${m + 1} частей`, 'Все равны $S$'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── Б4: две величины уменьшения, остаток ─────────────────────── */

const B11: Prototype = {
  id: 'B-11',
  type: 'B',
  subtype: 'Б4',
  source: 'fipi',
  difficulty: 'hard',
  units: 'rub',
  title: 'Две величины уменьшения: долг в точке перелома',
  forbid: [{ S: 1500, m: 5, r: 10, Z: 2300 }],
  make({ rng, plot }) {
    const m = rng.pick([3, 4, 5]);
    const r = D(rng.pick(['10', '12', '15', '20']));
    const S = D(rng.int(5, 30) * 100);
    const d = D(rng.int(1, S.toNumber() / 100 - 1) * 100); // долг после m-го года, тыс.
    const X1 = S.sub(d).div(m);
    const X2 = d.div(m);
    if (X1.eq(X2) || !isNice(X1, 2) || !isNice(X2, 2)) return null;
    const ends = [
      ...Array.from({ length: m }, (_, i) => S.sub(X1.mul(i + 1))),
      ...Array.from({ length: m }, (_, i) => d.sub(X2.mul(i + 1))),
    ];
    const rows = byDebts(S, ends, r);
    const Z = totalPaid(rows);
    const firstSum = S.mul(m).sub(X1.mul(((m - 1) * m) / 2));
    const secondSum = d.mul(m + 1).div(2);
    const Zf = S.add(r.div(100).mul(firstSum.add(secondSum)));
    if (!Zf.eq(Z) || !isNice(Z, 1)) return null;
    const dFound = solveLinear((x) => {
      const e = [
        ...Array.from({ length: m }, (_, i) =>
          S.sub(
            S.sub(x)
              .div(m)
              .mul(i + 1),
          ),
        ),
        ...Array.from({ length: m }, (_, i) => x.sub(x.div(m).mul(i + 1))),
      ];
      return totalPaid(byDebts(S, e, r));
    }, Z);
    const y = plot.year;
    return {
      condition:
        `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на ${years(2 * m)} в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
        `— каждый январь долг возрастает на ${pct(r)} по сравнению с концом предыдущего года;\n` +
        `— с февраля по июнь каждого года необходимо выплатить одним платежом часть долга;\n` +
        `— в июле ${yearList(y + 1, m)} годов долг должен быть на какую-то одну и ту же величину меньше долга на июль предыдущего года;\n` +
        `— в июле ${yearList(y + m + 1, m)} годов долг должен быть на другую одну и ту же величину меньше долга на июль предыдущего года;\n` +
        `— к июлю ${y + 2 * m} года долг должен быть выплачен полностью.\n` +
        `Известно, что сумма всех платежей после полного погашения кредита будет равна ${money(Z, 'thous')}. Сколько рублей составит долг в июле ${y + m} года?`,
      answer: d.mul(1000),
      verify: dFound.mul(1000),
      params: { S: S.toNumber(), m, r: r.toNumber(), Z: Z.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          `Пусть $x$ — долг в июле ${y + m} года (тыс. рублей). Первые ${m} лет долг убывает на $\\dfrac{${tex(S)} - x}{${m}}$, следующие ${m} лет — на $\\dfrac{x}{${m}}$.`,
        ),
        stChangeSum(),
        step(
          'Долги на начало: первый кусок',
          `${m} слагаемых от $${tex(S)}$ вниз с шагом $\\dfrac{${tex(S)} - x}{${m}}$.`,
          `${m}\\cdot ${tex(S)} - \\frac{${tex(S)} - x}{${m}}\\cdot ${((m - 1) * m) / 2}`,
        ),
        step(
          'Долги на начало: второй кусок',
          `От $x$ до $\\dfrac{x}{${m}}$ — полусумма, умноженная на ${m}.`,
          `\\frac{x + \\frac{x}{${m}}}{2}\\cdot ${m} = \\frac{${m + 1}x}{2}`,
        ),
        step(
          'Составляем уравнение и решаем',
          'Кредит плюс переплата — сумма платежей.',
          `${tex(S)} + \\frac{${tex(r)}}{100}\\Big(${m}\\cdot ${tex(S)} - \\frac{${tex(S)} - x}{${m}}\\cdot ${((m - 1) * m) / 2} + \\frac{${m + 1}x}{2}\\Big) = ${tex(Z)} \\;\\Rightarrow\\; x = ${tex(d)}`,
        ),
        step(
          'Переводим в рубли',
          'Считали в тысячах.',
          `${tex(d)}\\ \\text{тыс.} = ${tex(d.mul(1000))}\\ \\text{руб.}`,
        ),
        stAnswer(`Долг в июле ${y + m} года — ${money(d.mul(1000), 'rub')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Что удобно обозначить за неизвестное?',
          `Долг в июле ${y + m} года`,
          ['Первый платёж', 'Ставку'],
          rng.int(0, 2),
          'Через него выражаются обе величины уменьшения.',
        ),
      ],
    };
  },
};

const B12: Prototype = {
  id: 'B-12',
  type: 'B',
  subtype: 'Б4',
  source: 'fipi',
  difficulty: 'hard',
  units: 'thous',
  title: '$n$ месяцев равномерно, затем остаток одним платежом — сумма выплат',
  forbid: [{ S: 1200, n: 30, D: 300, r: 1 }],
  make({ rng, plot }) {
    const n = rng.int(6, 30);
    const X = D(rng.pick([5, 10, 15, 20, 25, 30, 40]));
    const d = D(rng.int(5, 40) * 10);
    const S = d.add(X.mul(n));
    const r = D(rng.pick(['1', '1.5', '2', '3']));
    const Z = S.add(
      r
        .div(100)
        .mul(S.add(d))
        .mul(n + 1)
        .div(2),
    );
    if (!isNice(Z, 2) || S.gt(3000)) return null;
    const rows = byDebts(S, fixedEnds(S, X, n), r);
    const month = rng.int(0, 11);
    return {
      condition:
        `15-го ${MONTHS_GEN[month]} ${plot.subject} планирует взять кредит ${plot.goal} на ${money(S, 'thous')}. Условия его возврата таковы:\n` +
        `— 1-го числа каждого месяца долг увеличивается на ${pct(r)} по сравнению с концом предыдущего месяца;\n` +
        `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
        `— в течение первых ${n} ${plural(n, 'месяца', 'месяцев', 'месяцев')} 15-го числа долг должен быть на одну и ту же величину меньше, чем месяцем раньше;\n` +
        `— 15-го числа ${n}-го месяца долг составит ${money(d, 'thous')}, а в следующем месяце кредит погашается одним платежом.\n` +
        `Чему равна общая сумма выплат? Ответ выразите в тысячах рублей.`,
      answer: Z,
      verify: totalPaid(rows),
      params: { S: S.toNumber(), n, D: d.toNumber(), r: r.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [n, n + 1],
      solution: [
        stTable(
          `Кредит длится ${n + 1} ${plural(n + 1, 'месяц', 'месяца', 'месяцев')}. Долги на начало месяцев убывают равномерно от $${tex(S)}$ до $${tex(d)}$ — это ${n + 1} членов арифметической прогрессии.`,
        ),
        stChangeSum(),
        step(
          'Сумма долгов на начало',
          'Полусумма первого и последнего, умноженная на число членов.',
          `\\frac{${tex(S)} + ${tex(d)}}{2}\\cdot ${n + 1} = ${tex(
            S.add(d)
              .mul(n + 1)
              .div(2),
          )}`,
        ),
        step(
          'Сумма выплат',
          `Переплата — ${num(r)} % от суммы долгов на начало.`,
          `${tex(S)} + \\frac{${tex(r)}}{100}\\cdot ${tex(
            S.add(d)
              .mul(n + 1)
              .div(2),
          )} = ${tex(Z)}`,
        ),
        stAnswer(`Общая сумма выплат — ${money(Z, 'thous')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Сколько месяцев начисляются проценты?',
          `${n + 1}: в последний месяц тоже`,
          [`${n}`, `${n - 1}`],
          rng.int(0, 2),
          'Остаток перед последним платежом тоже растёт на проценты.',
        ),
      ],
    };
  },
};

/* ── Б5: льготный кредит ──────────────────────────────────────── */

/** Платежи льготного кредита: m лет только проценты, затем два равных (через солвер). */
function lgotRows(S: Drob, m: number, r: Drob) {
  const x = equalPayment(S, 2, r);
  const interest = S.mul(kOf(r)).sub(S);
  return byPayments(S, [...Array(m).fill(interest), x, x] as Drob[], r);
}

function lgotFrame(
  plot: { subject: string; goal: string; year: number },
  S: Drob,
  r: string,
  extra: string,
): string {
  const y = plot.year;
  return (
    `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на пять лет в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
    `— каждый январь долг возрастает на ${r} по сравнению с концом предыдущего года;\n` +
    `— с февраля по июнь каждого года необходимо выплатить часть долга;\n` +
    `— в июле ${yearList(y + 1, 3)} годов долг остаётся равным ${money(S, 'thous')};\n` +
    `— ${extra};\n` +
    `— к июлю ${y + 5} года долг будет выплачен полностью.`
  );
}

/**
 * Льготный кредит в буквах: m лет платим только проценты S(k − 1), долг
 * остаётся S; затем два равных платежа x гасят долг. Таблица, уравнение
 * и формула платежа — общие для B-13, B-14, B-15.
 */
function lgotSteps(m: number) {
  const proc = (i: number) => ({
    label: String(i),
    cells: ['S', 'Sk', 'S(k - 1)', 'S'] as [string, string, string, string],
  });
  const t: TablitsaPeremennye = {
    podpis: `Первые ${m} года — только проценты, затем два равных платежа`,
    period: 'year',
    scheme: 'ann',
    rows: [
      ...Array.from({ length: m }, (_, i) => proc(i + 1)),
      { label: String(m + 1), cells: ['S', 'Sk', 'x', 'Sk - x'] },
      { label: String(m + 2), cells: ['Sk - x', 'Sk^{2} - xk', 'x', '0'] },
    ],
    itog: ['', `${m}S(k - 1) + 2x`],
    strelka: null,
  };
  return [
    stTablitsaBukvy(
      `Каждый январь долг умножается на $k = 1 + \\dfrac{r}{100}$. Первые ${m} года долг не меняется: платим только проценты $S(k - 1)$. Потом долг $S$ гасится двумя равными платежами $x$.`,
      t,
    ),
    step(
      'Составляем уравнение',
      'Долг на конец последнего года — последняя строка таблицы; после второго платежа он равен нулю.',
      'Sk^{2} - xk - x = 0',
    ),
    step(
      'Выражаем платёж',
      'Переносим платежи вправо и выносим $x$.',
      'Sk^{2} = x(k + 1) \\;\\Rightarrow\\; x = \\dfrac{Sk^{2}}{k + 1}',
    ),
  ];
}

const B13: Prototype = {
  id: 'B-13',
  type: 'B',
  subtype: 'Б5',
  source: 'fipi',
  sourceNote: 'по задачам ЕГЭ-2016 и ЕГЭ-2024',
  difficulty: 'base',
  units: 'percent',
  title: 'Льготный кредит: найти ставку по сумме выплат',
  forbid: [
    { S: 220, Z: 420 },
    { S: 4200, Z: 6100 },
    { S: 6600, Z: 12600 },
    { S: 630, Z: 915 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '15', '20', '25', '30']));
    const k = kOf(r);
    const S = D(rng.int(10, 900) * 10);
    const x = S.mul(k.pow(2)).div(k.add(1));
    const Z = S.mul(k.sub(1)).mul(3).add(x.mul(2));
    if (!isNice(x, 2) || !isNice(Z, 2) || !x.isInteger()) return null;
    const koren = S.mul(10).mul(k).sub(Z); // √(Z² + 20S(3S + Z)) = 10Sk − Z
    let found: Drob = D(0);
    for (let q = 1; q <= 60; q++) {
      const rows = lgotRows(S, 3, D(q));
      if (rows[4]!.end.eq(0) && totalPaid(rows).eq(Z)) found = D(q);
    }
    return {
      condition: `${lgotFrame(plot, S, '$r$ %', `выплаты в ${plot.year + 4} и ${plot.year + 5} годах равны`)}\nНайдите $r$, если общая сумма выплат составит ${money(Z, 'thous')}.`,
      answer: r,
      verify: found,
      params: { S: S.toNumber(), Z: Z.toNumber() },
      rows: lgotRows(S, 3, r),
      scheme: 'dif',
      period: 'year',
      solution: [
        ...lgotSteps(3),
        step(
          'Составляем уравнение на сумму выплат',
          'Три раза проценты и два равных платежа — вся сумма выплат $Z$.',
          'Z = 3S(k - 1) + 2x = 3S(k - 1) + \\dfrac{2Sk^{2}}{k + 1}',
        ),
        step(
          'Приводим к квадратному уравнению',
          'Умножаем обе части на $k + 1$ и собираем всё в одной части.',
          'Z(k + 1) = 3S(k^{2} - 1) + 2Sk^{2} \\;\\Rightarrow\\; 5S\\,k^{2} - Z\\,k - (3S + Z) = 0',
        ),
        stFormula(
          '$k > 1$ — берём положительный корень; второй отрицательный.',
          'k = \\dfrac{Z + \\sqrt{Z^{2} + 20S(3S + Z)}}{10S}, \\qquad r = 100\\,(k - 1)',
        ),
        stChisla(`Считаем в тысячах рублей: $S = ${tex(S)}$, $Z = ${tex(Z)}$.`, [
          `${tex(S.mul(5))}\\,k^{2} - ${tex(Z)}\\,k - ${tex(S.mul(3).add(Z))} = 0`,
          `k = \\dfrac{${tex(Z)} + \\sqrt{${tex(Z.mul(Z))} + ${tex(S.mul(20).mul(S.mul(3).add(Z)))}}}{${tex(S.mul(10))}} = \\dfrac{${tex(Z)} + ${tex(koren)}}{${tex(S.mul(10))}} = ${tex(k)}`,
          `r = 100\\,(${tex(k)} - 1) = ${tex(r)}`,
        ]),
        stAnswer(`$r = ${tex(r)}$.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Сколько платят в первые три года?',
          'Только проценты: долг не меняется',
          ['Треть долга каждый год', 'Ничего'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B14: Prototype = {
  id: 'B-14',
  type: 'B',
  subtype: 'Б5',
  source: 'fipi',
  difficulty: 'hard',
  units: 'mln',
  title: 'Льготный кредит на целое число млн: наибольший или наименьший при ограничении',
  forbid: [
    { r: 20, m: 3, N: 70 },
    { r: 20, m: 3, N: 100 },
    { r: 25, m: 2, N: 90 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25', '30']));
    const m = rng.pick([2, 3]);
    const k = kOf(r);
    const c = k
      .sub(1)
      .mul(m)
      .add(k.pow(2).mul(2).div(k.add(1))); // сумма выплат на 1 млн
    const S0 = rng.int(2, 15);
    const wantMax = rng.next() < 0.5;
    let N: Drob;
    let found: number | null;
    const total = (s: number) => totalPaid(lgotRows(D(s), m, r));
    if (wantMax) {
      N = D(c.mul(S0).mul(10).floor() + 1n).div(10);
      if (N.gt(c.mul(S0 + 1))) return null;
      found = largestInt((s) => total(s).lt(N), 1, 200);
    } else {
      N = D(c.mul(S0).mul(10).ceil() - 1n).div(10);
      if (!N.gt(c.mul(S0 - 1)) && !N.eq(c.mul(S0 - 1))) return null;
      if (!c.mul(S0).gt(N)) return null;
      found = smallestInt((s) => total(s).gt(N), 1, 200);
    }
    if (found === null) return null;
    const yearsOnly = m === 2 ? '1-го и 2-го' : '1-го, 2-го и 3-го';
    const yearsEq = m === 2 ? '3-го и 4-го' : '4-го и 5-го';
    return {
      condition:
        `Планируется выдать льготный кредит ${plot.goal} на целое число миллионов рублей на ${years(m + 2)}. В середине каждого года действия кредита долг заёмщика возрастает на ${pct(r)} по сравнению с началом года. ` +
        `В конце ${yearsOnly} годов заёмщик выплачивает только проценты по кредиту, оставляя долг неизменно равным первоначальному. В конце ${yearsEq} годов заёмщик выплачивает одинаковые суммы, погашая весь долг полностью. ` +
        (wantMax
          ? `Найдите наибольший размер кредита, при котором общая сумма выплат заёмщика будет меньше ${money(N, 'mln')}.`
          : `Найдите наименьший размер кредита, при котором общая сумма выплат заёмщика превысит ${money(N, 'mln')}.`),
      answer: D(S0),
      verify: D(found),
      params: { r: r.toNumber(), m, N: N.mul(10).toNumber() },
      rows: lgotRows(D(S0), m, r),
      scheme: 'dif',
      period: 'year',
      solution: [
        ...lgotSteps(m),
        stFormula(
          `${m} раза проценты и два равных платежа: сумма выплат — множитель, умноженный на $S$.`,
          `Z = ${m}S(k - 1) + \\dfrac{2Sk^{2}}{k + 1} = \\Big(${m}(k - 1) + \\dfrac{2k^{2}}{k + 1}\\Big)S`,
        ),
        stChisla(`$r = ${tex(r)}$.`, [
          `k = ${tex(k)}, \\qquad Z = \\Big(${m}\\cdot ${tex(k.sub(1))} + \\dfrac{2\\cdot ${tex(k.pow(2))}}{${tex(k.add(1))}}\\Big)S = ${texQ(c)}\\,S`,
        ]),
        step(
          'Неравенство и целое число',
          wantMax
            ? `Ищем наибольшее целое $S$: при $S = ${S0}$ сумма меньше ${num(N)}, при $S = ${S0 + 1}$ — уже нет.`
            : `Ищем наименьшее целое $S$: при $S = ${S0}$ сумма больше ${num(N)}, при $S = ${S0 - 1}$ — ещё нет.`,
          wantMax ? `${texQ(c)}\\,S < ${tex(N)}` : `${texQ(c)}\\,S > ${tex(N)}`,
        ),
        stAnswer(`${money(S0, 'mln')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Чему равна выплата в годы «только проценты»?',
          '$S\\,(k - 1)$',
          ['$S\\,k$', '$\\dfrac{S}{2}$'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B15: Prototype = {
  id: 'B-15',
  type: 'B',
  subtype: 'Б5',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2020',
  difficulty: 'base',
  units: 'rub',
  title: 'Льготный кредит: известны два последних платежа — общая сумма',
  forbid: [{ r: 20, X: 360 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25']));
    const k = kOf(r);
    const X = D(rng.int(5, 200) * 10); // тыс.
    const S = X.mul(k.add(1)).div(k.pow(2));
    const total = S.mul(k.sub(1)).mul(3).add(X.mul(2));
    if (!isNice(S, 2) || !total.mul(1000).isInteger()) return null;
    const Sfound = X.div(equalPayment(1, 2, r));
    const rows = lgotRows(Sfound, 3, r);
    const y = plot.year;
    return {
      condition:
        `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на пять лет в размере $S$ тыс. рублей. Условия его возврата таковы:\n` +
        `— каждый январь долг возрастает на ${pct(r)} по сравнению с концом предыдущего года;\n` +
        `— с февраля по июнь каждого года необходимо выплатить часть долга;\n` +
        `— в июле ${yearList(y + 1, 3)} годов долг остаётся равным $S$ тыс. рублей;\n` +
        `— выплаты в ${y + 4} и ${y + 5} годах равны по ${money(X, 'thous')};\n` +
        `— к июлю ${y + 5} года долг будет выплачен полностью.\n` +
        `Найдите общую сумму выплат за пять лет. Ответ дайте в рублях.`,
      answer: total.mul(1000),
      verify: totalPaid(rows).mul(1000),
      params: { r: r.toNumber(), X: X.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        ...lgotSteps(3),
        stFormula(
          'Платёж известен — выражаем $S$; сумма выплат — три раза проценты и два платежа.',
          'S = \\dfrac{x(k + 1)}{k^{2}}, \\qquad Z = 3S(k - 1) + 2x',
        ),
        stChisla(`Считаем в тысячах рублей: $x = ${tex(X)}$, $k = ${tex(k)}$.`, [
          `S = \\dfrac{${tex(X)}\\cdot ${tex(k.add(1))}}{${tex(k.pow(2))}} = ${tex(S)}`,
          `Z = 3\\cdot ${tex(S)}\\cdot ${tex(k.sub(1))} + 2\\cdot ${tex(X)} = ${tex(total)}\\ \\text{тыс.} = ${tex(total.mul(1000))}\\ \\text{руб.}`,
        ]),
        stAnswer(`${money(total.mul(1000), 'rub')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Что сначала найти?',
          'Сумму кредита $S$ по двум равным платежам',
          ['Ставку', 'Число лет'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── Б6: сначала равномерно, потом равными платежами ─────────── */

const B16: Prototype = {
  id: 'B-16',
  type: 'B',
  subtype: 'Б6',
  source: 'own',
  sourceNote: 'авторская (зачёт)',
  difficulty: 'hard',
  units: 'thous',
  title: 'Сначала долг уменьшается на долю кредита, потом два равных платежа — найти $S$',
  forbid: [{ r: 25, f: 20, Z: 303 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25']));
    const f = D(rng.pick(['0.1', '0.2', '0.25']));
    const k = kOf(r);
    const a = D(1).sub(f);
    const b = D(1).sub(f.mul(2));
    const unit = k
      .sub(a)
      .add(a.mul(k).sub(b))
      .add(b.mul(k.pow(2)).div(k.add(1)).mul(2));
    const den = Number(unit.d);
    if (den > 2000) return null;
    const S = D(den * rng.int(1, Math.max(1, Math.floor(3000 / den))));
    if (S.lt(50)) return null;
    const Z = unit.mul(S);
    if (!isNice(Z, 1)) return null;
    const first = byDebts(1, [a, b], r);
    const x1 = equalPayment(b, 2, r);
    const unitSolver = totalPaid(first).add(x1.mul(2));
    const x = b.mul(S).mul(k.pow(2)).div(k.add(1));
    const rows = byPayments(S, [first[0]!.payment.mul(S), first[1]!.payment.mul(S), x, x], r);
    const fracTex = f.eq('0.1')
      ? '\\dfrac{1}{10}'
      : f.eq('0.2')
        ? '\\dfrac{1}{5}'
        : '\\dfrac{1}{4}';
    return {
      condition:
        `В ${plot.year} году ${plot.subject} ${v(plot, 'взял', 'взяла')} в кредит сумму $S$ ${plot.goal} на 4 года под ${pct(r)} годовых: каждый год банк сначала начисляет проценты, затем вносится платёж. ` +
        `В первые два года после очередной выплаты долг уменьшается на $${fracTex}$ первоначальной суммы кредита, а выплаты третьего и четвёртого годов равны между собой. Всего выплачено ${money(Z, 'thous')}. Найдите $S$ (в тысячах рублей).`,
      answer: S,
      verify: Z.div(unitSolver),
      params: { r: r.toNumber(), f: f.mul(100).toNumber(), Z: Z.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          `Первые два года — дифференцированная часть: долг на конец $${tex(a)}S$, затем $${tex(b)}S$. Последние два года — аннуитетная часть: остаток $${tex(b)}S$ гасится двумя равными платежами $x$ (в теории для этой части таблица «Долг на начало · Долг после начисления · Платёж · Долг на конец»).`,
        ),
        step(
          'Первые две выплаты',
          `Долг после начисления минус долг на конец, $k = ${tex(k)}$.`,
          `z_1 = ${tex(k)}S - ${tex(a)}S = ${tex(k.sub(a))}S,\\quad z_2 = ${tex(k)}\\cdot ${tex(a)}S - ${tex(b)}S = ${tex(a.mul(k).sub(b))}S`,
        ),
        step(
          'Два равных платежа',
          'Остаток растёт на проценты, после второго платежа долг равен нулю.',
          `(${tex(b)}S\\,k - x)\\,k - x = 0 \\;\\Rightarrow\\; x = \\frac{${tex(b)}S\\,k^2}{k+1} = ${texQ(b.mul(k.pow(2)).div(k.add(1)))}S`,
        ),
        step(
          'Составляем уравнение',
          'Все выплаты вместе.',
          `${texQ(unit)}\\,S = ${tex(Z)} \\;\\Rightarrow\\; S = ${tex(S)}`,
        ),
        stAnswer(`$S = ${tex(S)}$ тыс. рублей.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Как гасится долг в последние два года?',
          'Двумя равными платежами, как аннуитет',
          ['Равномерно, как в первые годы', 'Одним платежом'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── Б7: известны некоторые платежи — таблица диф. платежа ───── */

const B17: Prototype = {
  id: 'B-17',
  type: 'B',
  subtype: 'Б7',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2022',
  difficulty: 'hard',
  units: 'rub',
  title: 'Платежи первых двух лет равны — найти платёж по сумме выплат',
  forbid: [{ S: 800, r: 20, Z: 1254.4 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25']));
    const k = kOf(r);
    const S = D(rng.int(3, 30) * 100);
    const x = D(rng.int(5, 60) * 10);
    const d1 = S.mul(k).sub(x);
    const d2 = d1.mul(k).sub(x);
    if (!d2.isPositive() || !d2.lt(d1) || !d1.lt(S)) return null;
    const Z = S.add(r.div(100).mul(S.add(d1).add(d2)));
    if (!isNice(Z, 1)) return null;
    const xFound = solveLinear((p) => {
      const rows = byPayments(S, [p, p], r);
      return p.mul(2).add(rows[1]!.end.mul(kOf(r)));
    }, Z);
    const rows = byPayments(S, [x, x, d2.mul(k)], r);
    const y = plot.year;
    return {
      condition:
        `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на три года в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
        `— каждый январь долг будет возрастать на ${pct(r)} по сравнению с концом предыдущего года;\n` +
        `— с февраля по июнь каждого года необходимо выплатить одним платежом часть долга;\n` +
        `— платежи в ${y + 1} и ${y + 2} годах должны быть равными;\n` +
        `— к июлю ${y + 3} года долг должен быть выплачен полностью.\n` +
        `Известно, что сумма всех платежей после полного погашения кредита будет равна ${money(Z, 'thous')}. Сколько рублей составит платёж ${y + 1} года?`,
      answer: x.mul(1000),
      verify: xFound.mul(1000),
      params: { S: S.toNumber(), r: r.toNumber(), Z: Z.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        stTablitsaBukvy(
          'Решаем таблицей дифференцированного платежа, считаем в тысячах рублей. Платежи первых двух лет равны $x$, третьим платежом гасится остаток. Долг на конец года — долг после начисления минус платёж: $D_{1} = Sk - x$, $D_{2} = D_{1}k - x$, где $k = 1 + \\dfrac{r}{100}$.',
          {
            podpis: '',
            period: 'year',
            scheme: 'dif',
            rows: [
              {
                label: String(y + 1),
                cells: ['S', 'S - D_{1}', '\\dfrac{r}{100}\\cdot S', 'D_{1}'],
              },
              {
                label: String(y + 2),
                cells: ['D_{1}', 'D_{1} - D_{2}', '\\dfrac{r}{100}\\cdot D_{1}', 'D_{2}'],
              },
              {
                label: String(y + 3),
                cells: ['D_{2}', 'D_{2}', '\\dfrac{r}{100}\\cdot D_{2}', '0'],
              },
            ],
            itog: ['S', 'P'],
            strelka: '$r\\,\\%$ начисляется на долг на начало года',
          },
        ),
        step(
          'Составляем уравнение',
          'Долг уменьшился с $S$ до нуля, поэтому столбец «Сумма изменения долга» в сумме даёт $S$. Вся сумма выплат $Z$ — кредит плюс переплата.',
          'Z = S + \\dfrac{r}{100}\\,(S + D_{1} + D_{2})',
        ),
        {
          title: 'Выражаем долги через $x$',
          text: 'Подставляем строки таблицы одну в другую.',
          bloki: [
            {
              vid: 'formula',
              tex: 'D_{1} = Sk - x, \\qquad D_{2} = (Sk - x)k - x = Sk^{2} - xk - x',
            },
            { vid: 'formula', tex: 'S + D_{1} + D_{2} = S(1 + k + k^{2}) - x(k + 2)' },
          ],
        },
        step(
          'Собираем $x$',
          'Ставка через множитель: $\\dfrac{r}{100} = k - 1$, и $(k - 1)(1 + k + k^{2}) = k^{3} - 1$.',
          'Z = S + (k - 1)\\big(S(1 + k + k^{2}) - x(k + 2)\\big) = Sk^{3} - (k - 1)(k + 2)\\,x',
        ),
        stFormula('Выражаем платёж.', 'x = \\dfrac{Sk^{3} - Z}{(k - 1)(k + 2)}'),
        stChisla(`Считаем в тысячах рублей: $S = ${tex(S)}$, $Z = ${tex(Z)}$.`, [
          `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}, \\qquad k^{3} = ${tex(k.pow(3))}`,
          `x = \\dfrac{${tex(S)}\\cdot ${tex(k.pow(3))} - ${tex(Z)}}{${tex(k.sub(1))}\\cdot ${tex(k.add(2))}} = \\dfrac{${tex(S.mul(k.pow(3)).sub(Z))}}{${tex(k.sub(1).mul(k.add(2)))}} = ${tex(x)}\\ \\text{тыс.} = ${tex(x.mul(1000))}\\ \\text{руб.}`,
        ]),
        stAnswer(`Платёж ${y + 1} года — ${money(x.mul(1000), 'rub')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Какой столбец таблицы даёт переплату?',
          '«Переплата»: ставка от долга на начало каждого года',
          ['«Платёж»', '«Сумма изменения долга»'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B18: Prototype = {
  id: 'B-18',
  type: 'B',
  subtype: 'Б7',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'Два платежа по $X$, остаток третьим — сумма платежей',
  forbid: [{ S: 634.5, r: 10, X: 100 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25']));
    const k = kOf(r);
    const S = D(rng.int(3, 30) * 100);
    const X = D(rng.int(3, 50) * 10);
    const d1 = S.mul(k).sub(X);
    const d2 = d1.mul(k).sub(X);
    if (!d2.isPositive() || !d2.lt(d1) || !d1.lt(S)) return null;
    const last = d2.mul(k);
    const Z = X.mul(2).add(last);
    if (!isNice(Z, 2)) return null;
    const rows = byPayments(S, [X, X, last], r);
    const y = plot.year;
    return {
      condition:
        `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на три года в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
        `— каждый январь долг будет возрастать на ${pct(r)} по сравнению с концом предыдущего года;\n` +
        `— с февраля по июнь каждого года необходимо выплатить часть долга;\n` +
        `— платежи в ${y + 1} и ${y + 2} годах должны быть по ${money(X, 'thous')};\n` +
        `— к июлю ${y + 3} года долг должен быть выплачен полностью.\n` +
        `Найдите сумму всех платежей после полного погашения кредита. Ответ выразите в тысячах рублей.`,
      answer: Z,
      verify: rows[2]!.end.eq(0) ? totalPaid(rows) : D(0),
      params: { S: S.toNumber(), r: r.toNumber(), X: X.toNumber() },
      rows,
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          'Платежи двух первых лет известны, третий гасит остаток. Долг на конец года — долг на начало, увеличенный на проценты, минус платёж.',
        ),
        step(
          'Первый год',
          `Долг растёт в $${tex(k)}$ раза, затем вычитаем платёж.`,
          `${tex(S)}\\cdot ${tex(k)} - ${tex(X)} = ${tex(d1)}`,
        ),
        step(
          'Второй год',
          'Так же со вторым платежом.',
          `${tex(d1)}\\cdot ${tex(k)} - ${tex(X)} = ${tex(d2)}`,
        ),
        step(
          'Третий платёж',
          'Гасит весь долг после начисления.',
          `${tex(d2)}\\cdot ${tex(k)} = ${tex(last)}`,
        ),
        step(
          'Сумма платежей',
          'Складываем три платежа.',
          `${tex(X)} + ${tex(X)} + ${tex(last)} = ${tex(Z)}`,
        ),
        stAnswer(`Сумма всех платежей — ${money(Z, 'thous')}.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        choice(
          'Чему равен последний платёж?',
          'Долгу на начало третьего года, увеличенному на проценты',
          ['Тоже $X$', 'Долгу на начало третьего года без процентов'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const B19: Prototype = {
  id: 'B-19',
  type: 'B',
  subtype: 'Б4',
  source: 'fipi',
  sourceNote: 'по демоверсии 2026 и задаче ЕГЭ-2023',
  difficulty: 'hard',
  units: 'percent',
  title: 'Двухфазный кредит на 10 лет: известен долг в середине срока — найти ставку',
  forbid: [
    { S: 800, D: 200, Z: 1480 },
    { S: 700, D: 600 },
  ],
  make({ rng, plot }) {
    const S = D(rng.int(4, 30) * 100);
    const d = D(rng.int(1, S.toNumber() / 100 - 1) * 100);
    const r = D(rng.pick(['8', '10', '12', '15', '20', '25']));
    const X1 = S.sub(d).div(5);
    const X2 = d.div(5);
    if (X1.eq(X2)) return null;
    const starts = S.mul(3).add(d.mul(5));
    const Z = S.add(r.div(100).mul(starts));
    if (!isNice(Z, 1)) return null;
    const ends = [
      ...Array.from({ length: 5 }, (_, i) => S.sub(X1.mul(i + 1))),
      ...Array.from({ length: 5 }, (_, i) => d.sub(X2.mul(i + 1))),
    ];
    let found: Drob = D(0);
    for (let q = 1; q <= 80; q++) if (totalPaid(byDebts(S, ends, D(q, 2))).eq(Z)) found = D(q, 2);
    const y = plot.year;
    return {
      condition:
        `В июле ${y} года ${plot.subject} планирует взять кредит ${plot.goal} на десять лет в размере ${money(S, 'thous')}. Условия его возврата таковы:\n` +
        `— каждый январь долг будет возрастать на $r$ % по сравнению с концом предыдущего года;\n` +
        `— с февраля по июнь каждого года необходимо оплатить одним платежом часть долга;\n` +
        `— в июле ${yearList(y + 1, 5)} годов долг должен быть на какую-то одну и ту же величину меньше долга на июль предыдущего года;\n` +
        `— в июле ${yearList(y + 6, 5)} годов долг должен быть на другую одну и ту же величину меньше долга на июль предыдущего года;\n` +
        `— к июлю ${y + 10} года долг должен быть выплачен полностью.\n` +
        `Известно, что долг в июле ${y + 5} года составит ${money(d, 'thous')}, а сумма всех платежей после полного погашения кредита — ${money(Z, 'thous')}. Найдите $r$.`,
      answer: r,
      verify: found,
      params: { S: S.toNumber(), D: d.toNumber(), Z: Z.toNumber() },
      rows: byDebts(S, ends, r),
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          `Первые пять лет долг убывает на $\\dfrac{${tex(S)} - ${tex(d)}}{5} = ${tex(X1)}$, следующие пять — на $\\dfrac{${tex(d)}}{5} = ${tex(X2)}$.`,
        ),
        stChangeSum(),
        step(
          'Сумма долгов на начало',
          'По кускам: первые пять лет — от ' +
            num(S) +
            ' с шагом ' +
            num(X1) +
            ', затем от ' +
            num(d) +
            ' с шагом ' +
            num(X2) +
            '.',
          `\\frac{${tex(S)} + ${tex(S.sub(X1.mul(4)))}}{2}\\cdot 5 + \\frac{${tex(d)} + ${tex(X2)}}{2}\\cdot 5 = ${tex(starts)}`,
        ),
        step(
          'Находим $r$',
          'Переплата — разность суммы платежей и кредита.',
          `\\frac{r}{100}\\cdot ${tex(starts)} = ${tex(Z)} - ${tex(S)} \\;\\Rightarrow\\; r = ${tex(r)}`,
        ),
        stAnswer(`$r = ${tex(r)}$.`),
      ],
      hints: [
        hintType('B', rng.int(0, 2)),
        hintChangeSum(rng.int(0, 2)),
        choice(
          'Как найти величины уменьшения долга?',
          `Разделить изменение долга за каждые пять лет на 5`,
          ['Разделить кредит на 10', 'Разделить кредит на 5'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

void sum;

export const PROTO_B: Prototype[] = [
  B01,
  makeShareBound('B-02'),
  makeShareBound('B-03'),
  makeFixed('B-04'),
  makeFixed('B-05'),
  B06,
  B07,
  B08,
  B09,
  B10,
  B11,
  B12,
  B13,
  B14,
  B15,
  B16,
  B17,
  B18,
  B19,
];
