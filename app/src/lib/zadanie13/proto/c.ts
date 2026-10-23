/**
 * Прототипы задания №13: аннуитет и «известны платежи» (C-01 … C-17).
 * Список и источники — docs/13-economics/03-prototypes.md.
 *
 * Таблица — формат «Долг на начало · Долг с процентами · Платёж · Долг
 * на конец». k = 1 + r/100 — увеличивающий коэффициент. Решение — через
 * цепочку (Sk − X)k − X = 0, раскрытие скобок и геометрическую
 * прогрессию; для четырёх платежей — разложение k³ + k² + k + 1 =
 * (k² + 1)(k + 1). Ответ `verify` находится только солвером
 * (byPayments, equalPayment), формулы прототипа он не повторяет.
 *
 * Номера C-09 и C-15 не используются: эти задачи перешли в «поломанные».
 */

import { D, type Drob, kOf } from '../drob';
import { v } from '../plots';
import { byPayments, equalPayment, totalPaid } from '../solver';
import { frameEnd, frameJan, money, num, pct, plural, years } from '../text';
import { choice, hintK, hintType, isNice, step, tex } from './common';
import type { Prototype } from './types';

/* ── Ставки: k обыкновенной дробью a/b ───────────────────────────── */

interface Rate {
  r: string;
  a: number;
  b: number;
}

const R10: Rate = { r: '10', a: 11, b: 10 };
const R20: Rate = { r: '20', a: 6, b: 5 };
const R25: Rate = { r: '25', a: 5, b: 4 };
const R125: Rate = { r: '12.5', a: 9, b: 8 };
const R30: Rate = { r: '30', a: 13, b: 10 };
const R50: Rate = { r: '50', a: 3, b: 2 };
const R15: Rate = { r: '15', a: 23, b: 20 };

/** G = a^{n−1} + a^{n−2}b + … + b^{n−1}: знаменатель аннуитетной дроби после сокращения. */
const geo = (a: number, b: number, n: number): number => {
  let s = 0;
  for (let i = 0; i < n; i++) s += a ** i * b ** (n - 1 - i);
  return s;
};

const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
const lcm = (x: number, y: number): number => (x / gcd(x, y)) * y;

/* ── Формулы аннуитета (сторона «формулы», не солвер) ───────────── */

/** Сумма k^{n−1} + … + k + 1. */
const sumK = (k: Drob, n: number): Drob => {
  let s = D(0);
  for (let i = 0; i < n; i++) s = s.add(k.pow(i));
  return s;
};

/** Платёж при n равных платежах: X = S·kⁿ / (kⁿ⁻¹ + … + 1). */
const annuityX = (S: Drob, k: Drob, n: number): Drob => S.mul(k.pow(n)).div(sumK(k, n));

/* ── Тексты ─────────────────────────────────────────────────────── */

const PAY_WORD: Record<number, string> = { 2: 'двумя', 3: 'тремя', 4: 'четырьмя' };

/** «тремя равными платежами (то есть за 3 года)». */
const equalPays = (n: number): string =>
  `${PAY_WORD[n] ?? n} равными платежами (то есть за ${years(n)})`;

/** k в TeX: «1{,}2 = \frac{6}{5}». */
const kTex = (rate: Rate): string => `${tex(kOf(rate.r))} = \\frac{${rate.a}}{${rate.b}}`;

const CHAIN: Record<number, string> = {
  2: '(Sk - X)k - X = 0',
  3: '((Sk - X)k - X)k - X = 0',
  4: '(((Sk - X)k - X)k - X)k - X = 0',
};

const OPEN: Record<number, string> = {
  2: 'Sk^2 = X(k + 1)',
  3: 'Sk^3 = X(k^2 + k + 1)',
  4: 'Sk^4 = X(k^3 + k^2 + k + 1) = X(k^2 + 1)(k + 1)',
};

const FORMULA_X: Record<number, string> = {
  2: 'X = \\frac{Sk^2}{k + 1}',
  3: 'X = \\frac{Sk^3}{k^2 + k + 1}',
  4: 'X = \\frac{Sk^4}{(k^2 + 1)(k + 1)}',
};

/* ── Общие шаги ─────────────────────────────────────────────────── */

const stTable = (text: string) => step('Составляем таблицу', text, undefined, true);

const stK = (rate: Rate) =>
  step(
    'Вводим коэффициент',
    `$k = 1 + \\dfrac{r}{100}$ — увеличивающий коэффициент: во столько раз вырастает долг после начисления процентов. Удобно записать его обыкновенной дробью.`,
    `k = 1 + \\frac{${tex(rate.r)}}{100} = ${kTex(rate)}`,
  );

const stChain = (n: number) =>
  step(
    'Записываем цепочку',
    'После каждого начисления процентов долг умножается на $k$, после каждого платежа уменьшается на $X$. После последнего платежа долг равен нулю.',
    CHAIN[n],
  );

const stOpen = (n: number) =>
  step(
    'Раскрываем скобки',
    n === 4
      ? 'В скобках — сумма геометрической прогрессии. Сумму из четырёх слагаемых раскладываем на множители группировкой: $k^3 + k^2 + k + 1 = k^2(k+1) + (k+1)$.'
      : 'Переносим платежи в правую часть: в скобках — сумма геометрической прогрессии.',
    OPEN[n],
  );

const stAnswer = (text: string) => step('Ответ', text);

const hintsC = (shift: number, last: ReturnType<typeof choice>[] = []) => [
  hintType('C', shift),
  hintK(shift + 1),
  ...last,
];

const hintChain = (n: number, shift: number) =>
  choice(
    'Какое уравнение описывает погашение кредита?',
    `$${CHAIN[n]}$`,
    [`$${CHAIN[n]!.replace(/- X/g, '+ X')}$`, `$S - ${n}X = 0$`],
    shift,
    'Сначала долг растёт в $k$ раз, потом уменьшается на платёж — и так каждый год.',
  );

/** Табличные подписи годов: «2027», «2028», … */
const yearLabels = (start: number, n: number): string[] =>
  Array.from({ length: n }, (_, i) => String(start + 1 + i));

/* ── Прототипы ──────────────────────────────────────────────────── */

const C01: Prototype = {
  id: 'C-01',
  type: 'C',
  subtype: 'В2',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2020 и демоверсии 2027',
  difficulty: 'base',
  units: 'rub',
  title: 'Два или три равных платежа — общая сумма выплат',
  forbid: [
    { S: 550000, r: 20, n: 2 },
    { S: 147000, r: 10, n: 2 },
    { S: 182000, r: 20, n: 3 },
  ],
  make({ rng, plot }) {
    const n = rng.pick([2, 3]);
    const rate = rng.pick([R10, R20, R25, R30, R50]);
    const G = geo(rate.a, rate.b, n);
    const c = rng.int(2, 40) * (rate.a ** n > 1000 ? 10 : 100);
    const S = D(c * rate.b * G);
    const X = D(c * rate.a ** n);
    if (S.lt(100000) || S.gt(9000000)) return null;
    const k = kOf(rate.r);
    const answer = annuityX(S, k, n).mul(n);
    const Xs = equalPayment(S, n, rate.r);
    const rows = byPayments(
      S,
      Array.from({ length: n }, () => Xs),
      rate.r,
    );
    return {
      condition: `${frameJan(plot, `на сумму ${money(S, 'rub')}`, D(rate.r))}\nСколько рублей будет выплачено банку, если известно, что кредит будет полностью погашен ${equalPays(n)}?`,
      answer,
      verify: totalPaid(rows),
      params: { S: S.toNumber(), r: Number(rate.r), n },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n),
      solution: [
        stK(rate),
        stTable(
          'Долг на начало года умножаем на $k$ — получаем долг с процентами, вычитаем платёж $X$ — получаем долг на конец.',
        ),
        stChain(n),
        stOpen(n),
        step(
          'Находим платёж',
          'Выражаем $X$ и подставляем числа; с $k$ дробью сокращения видны сразу.',
          `${FORMULA_X[n]} = \\frac{${tex(S)}\\cdot ${tex(k.pow(n))}}{${tex(sumK(k, n))}} = ${tex(X)}`,
        ),
        step(
          'Общая сумма выплат',
          `Платежей ${n}, все равны $X$.`,
          `${n}X = ${n}\\cdot ${tex(X)} = ${tex(answer)}`,
        ),
        stAnswer(`Банку будет выплачено ${money(answer, 'rub')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [hintChain(n, rng.int(0, 2))]),
    };
  },
};

function makeEqualFour(id: 'C-02' | 'C-10'): Prototype {
  const askTotal = id === 'C-10';
  return {
    id,
    type: 'C',
    subtype: askTotal ? 'В2' : 'В1',
    source: 'fipi',
    ...(askTotal ? { sourceNote: 'по задаче ЕГЭ-2019' } : {}),
    difficulty: 'base',
    units: 'rub',
    title: askTotal
      ? 'Четыре равных платежа — общая сумма выплат'
      : 'Четыре равных платежа — размер платежа',
    forbid: askTotal ? [{ S: 419375, r: 20 }] : [{ S: 8052000, r: 20 }],
    make({ rng, plot }) {
      const rate = rng.pick([R10, R20, R25, R50]);
      const G = geo(rate.a, rate.b, 4);
      const c = rng.int(1, 60) * (rate.a ** 4 > 5000 ? 1 : rate.a ** 4 > 600 ? 10 : 100);
      const S = D(c * rate.b * G);
      if (S.lt(200000) || S.gt(20000000)) return null;
      const k = kOf(rate.r);
      const X = annuityX(S, k, 4);
      if (!X.isInteger()) return null;
      const answer = askTotal ? X.mul(4) : X;
      const Xs = equalPayment(S, 4, rate.r);
      const rows = byPayments(S, [Xs, Xs, Xs, Xs], rate.r);
      const k2 = k.pow(2);
      return {
        condition:
          `${frameJan(plot, `на сумму ${money(S, 'rub')}`, D(rate.r))}\n` +
          (askTotal
            ? `Сколько рублей будет выплачено банку, если известно, что кредит будет полностью погашен ${equalPays(4)}?`
            : `Сколько рублей нужно платить ежегодно, чтобы кредит был полностью погашен ${equalPays(4)}?`),
        answer,
        verify: askTotal ? totalPaid(rows) : Xs,
        params: { S: S.toNumber(), r: Number(rate.r) },
        rows,
        scheme: 'ann',
        period: 'year',
        labels: yearLabels(plot.year, 4),
        solution: [
          stK(rate),
          stTable(
            'Каждый год: долг на начало $\\cdot\\, k$ — долг с процентами, минус платёж $X$ — долг на конец.',
          ),
          stChain(4),
          stOpen(4),
          step(
            'Находим платёж',
            'Разложение на множители сокращает счёт: вместо четырёх степеней — два множителя.',
            `X = \\frac{Sk^4}{(k^2 + 1)(k + 1)} = \\frac{${tex(S)}\\cdot ${tex(k.pow(4))}}{${tex(k2.add(1))}\\cdot ${tex(k.add(1))}} = ${tex(X)}`,
          ),
          ...(askTotal
            ? [
                step(
                  'Общая сумма выплат',
                  'Четыре равных платежа.',
                  `4X = 4\\cdot ${tex(X)} = ${tex(answer)}`,
                ),
              ]
            : []),
          stAnswer(
            askTotal
              ? `Банку будет выплачено ${money(answer, 'rub')}.`
              : `Платить нужно по ${money(answer, 'rub')} в год.`,
          ),
        ],
        hints: hintsC(rng.int(0, 2), [
          choice(
            'Как разложить $k^3 + k^2 + k + 1$?',
            '$(k^2 + 1)(k + 1)$',
            ['$(k + 1)^3$', '$(k^2 - 1)(k + 1)$'],
            rng.int(0, 2),
            'Группируем: $k^2(k + 1) + (k + 1) = (k^2 + 1)(k + 1)$.',
          ),
        ]),
      };
    },
  };
}

const C03: Prototype = {
  id: 'C-03',
  type: 'C',
  subtype: 'В9',
  source: 'fipi',
  difficulty: 'hard',
  units: 'rub',
  title: 'На сколько больше отдать при большем числе равных платежей',
  forbid: [
    { S: 4026000, r: 20, n: 4 },
    { S: 7378000, r: 12.5, n: 3 },
  ],
  make({ rng, plot }) {
    const n = rng.pick([3, 4]);
    const rate = rng.pick(n === 4 ? [R10, R20, R25] : [R10, R20, R25, R125]);
    const unit = lcm(rate.b * geo(rate.a, rate.b, n), rate.b * geo(rate.a, rate.b, 2));
    const c = rng.int(1, 40) * (unit < 2000 ? 1000 : unit < 20000 ? 100 : 10);
    const S = D(unit * c);
    if (S.lt(500000) || S.gt(20000000)) return null;
    const k = kOf(rate.r);
    const Xn = annuityX(S, k, n);
    const X2 = annuityX(S, k, 2);
    if (!Xn.isInteger() || !X2.isInteger()) return null;
    const answer = Xn.mul(n).sub(X2.mul(2));
    const Xs = equalPayment(S, n, rate.r);
    const Ys = equalPayment(S, 2, rate.r);
    const rows = byPayments(
      S,
      Array.from({ length: n }, () => Xs),
      rate.r,
    );
    const verify = totalPaid(rows).sub(totalPaid(byPayments(S, [Ys, Ys], rate.r)));
    return {
      condition:
        `${frameJan(plot, `на сумму ${money(S, 'rub')}`, D(rate.r))}\n` +
        `На сколько рублей больше придётся отдать банку, если кредит будет полностью погашен ${equalPays(n)}, по сравнению со случаем, когда он будет погашен ${equalPays(2)}?`,
      answer,
      verify,
      params: { S: S.toNumber(), r: Number(rate.r), n },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n),
      solution: [
        stK(rate),
        stTable(`Таблица для ${n} платежей; для двух платежей она устроена так же.`),
        stChain(n),
        stOpen(n),
        step(
          `${n} платежа`,
          `Находим платёж и всё, что отдадим банку.`,
          `${FORMULA_X[n]} = ${tex(Xn)}, \\quad ${n}X = ${tex(Xn.mul(n))}`,
        ),
        step(
          '2 платежа',
          'Та же цепочка из двух звеньев.',
          `Y = \\frac{Sk^2}{k + 1} = ${tex(X2)}, \\quad 2Y = ${tex(X2.mul(2))}`,
        ),
        step(
          'Разность',
          'Сумма кредита одна, разница — только в переплате.',
          `${n}X - 2Y = ${tex(Xn.mul(n))} - ${tex(X2.mul(2))} = ${tex(answer)}`,
        ),
        stAnswer(`На ${money(answer, 'rub')} больше.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Что нужно сравнить?',
          `Общие суммы выплат: $${n}X$ и $2Y$`,
          [`Платежи: $X$ и $Y$`, 'Суммы кредита'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const C04: Prototype = {
  id: 'C-04',
  type: 'C',
  subtype: 'В3',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2015',
  difficulty: 'base',
  units: 'mln',
  title: 'По равному платежу найти сумму кредита',
  forbid: [{ X: 2.16, r: 20 }],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25, R50]);
    const n = 3;
    const den = rate.a ** 3 > 1000 ? 1000 : 100;
    const m = rng.int(1, 12);
    const X = D(rate.a ** 3 * m, den);
    const S = D(rate.b * geo(rate.a, rate.b, n) * m, den);
    if (X.gt(15) || !isNice(S, 2) || !isNice(X, 3)) return null;
    const k = kOf(rate.r);
    const answer = X.mul(sumK(k, n)).div(k.pow(n));
    const verify = X.div(equalPayment(1, n, rate.r));
    const rows = byPayments(S, [X, X, X], rate.r);
    return {
      condition: `${frameJan(plot, '', D(rate.r))}\nСумма каждого платежа равна ${money(X, 'mln')}. Сколько миллионов рублей было взято в кредит, если он был полностью погашен ${equalPays(n)}?`,
      answer,
      verify,
      params: { X: X.toNumber(), r: Number(rate.r) },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n),
      solution: [
        stK(rate),
        stTable('Сумму кредита обозначим $S$, считаем в миллионах рублей.'),
        stChain(n),
        stOpen(n),
        step(
          'Находим сумму кредита',
          'Теперь неизвестна $S$: делим обе части на $k^3$.',
          `S = \\frac{X(k^2 + k + 1)}{k^3} = \\frac{${tex(X)}\\cdot ${tex(sumK(k, n))}}{${tex(k.pow(n))}} = ${tex(answer)}`,
        ),
        stAnswer(`В кредит взято ${money(answer, 'mln')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [hintChain(n, rng.int(0, 2))]),
    };
  },
};

const C05: Prototype = {
  id: 'C-05',
  type: 'C',
  subtype: 'В4',
  source: 'fipi',
  sourceNote: 'по задачам ЕГЭ-2017 и ЕГЭ-2020',
  difficulty: 'base',
  units: 'rub',
  title: 'По переплате найти сумму кредита или сумму выплат',
  forbid: [
    { P: 48250, r: 20 },
    { P: 78030, r: 30 },
    { P: 156060, r: 30 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25, R30]);
    const n = 3;
    const G = geo(rate.a, rate.b, n);
    const c = rng.int(1, 80) * (rate.a ** 3 > 1000 ? 10 : 50);
    const S = D(c * rate.b * G);
    const X = D(c * rate.a ** 3);
    const P = X.mul(3).sub(S);
    if (S.lt(50000) || S.gt(5000000)) return null;
    const askTotal = rng.next() < 0.5;
    const k = kOf(rate.r);
    // формула: П = 3X − S = S(3k³/(k² + k + 1) − 1)
    const coef = k.pow(3).mul(3).div(sumK(k, 3)).sub(1);
    const Sf = P.div(coef);
    const answer = askTotal ? Sf.add(P) : Sf;
    const unitPay = equalPayment(1, n, rate.r);
    const Ss = P.div(unitPay.mul(3).sub(1));
    const verify = askTotal
      ? totalPaid(byPayments(Ss, [unitPay.mul(Ss), unitPay.mul(Ss), unitPay.mul(Ss)], rate.r))
      : Ss;
    const rows = byPayments(S, [X, X, X], rate.r);
    return {
      condition:
        `${frameJan(plot, 'на некоторую сумму', D(rate.r))}\n` +
        (askTotal
          ? `Сколько рублей будет выплачено банку, если известно, что кредит будет полностью погашен ${equalPays(n)} и общая сумма выплат после полного погашения кредита на ${money(P, 'rub')} больше суммы, взятой в кредит?`
          : `Определите, на какую сумму взят кредит, если известно, что кредит будет полностью погашен ${equalPays(n)} и общая сумма выплат на ${money(P, 'rub')} больше суммы, взятой в кредит.`),
      answer,
      verify,
      params: { P: P.toNumber(), r: Number(rate.r), ask: askTotal ? 1 : 0 },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n),
      solution: [
        stK(rate),
        stTable('Сумму кредита обозначим $S$, платёж — $X$.'),
        stChain(n),
        stOpen(n),
        step(
          'Платёж через $S$',
          'Подставляем $k$ дробью — получается доля от суммы кредита.',
          `X = \\frac{Sk^3}{k^2 + k + 1} = \\frac{${tex(k.pow(3))}}{${tex(sumK(k, 3))}}\\,S`,
        ),
        step(
          'Уравнение по переплате',
          'Переплата — всё, что отдали, минус сумма кредита.',
          `3X - S = ${tex(P)} \\;\\Rightarrow\\; S\\Big(\\frac{3\\cdot ${tex(k.pow(3))}}{${tex(sumK(k, 3))}} - 1\\Big) = ${tex(P)} \\;\\Rightarrow\\; S = ${tex(Sf)}`,
        ),
        ...(askTotal
          ? [
              step(
                'Общая сумма выплат',
                'Кредит плюс переплата.',
                `${tex(Sf)} + ${tex(P)} = ${tex(answer)}`,
              ),
            ]
          : []),
        stAnswer(
          askTotal
            ? `Банку будет выплачено ${money(answer, 'rub')}.`
            : `Кредит взят на сумму ${money(answer, 'rub')}.`,
        ),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Как записать «общая сумма выплат больше суммы кредита на $S_{\\text{перепл}}$»?',
          '$3X - S = S_{\\text{перепл}}$',
          ['$3X = S_{\\text{перепл}}$', '$X - S = S_{\\text{перепл}}$'],
          rng.int(0, 2),
          'Платежей три, и из их суммы вычитаем то, что взяли.',
        ),
      ]),
    };
  },
};

const C06: Prototype = {
  id: 'C-06',
  type: 'C',
  subtype: 'В7',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'Каждый следующий платёж в $q$ раз больше — найти первый',
  forbid: [
    { S: 270200, r: 10, q: 3 },
    { S: 741000, r: 10, q: 2 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25]);
    const q = rng.pick([2, 3]);
    const H = rate.a ** 2 + q * rate.a * rate.b + q * q * rate.b ** 2;
    const c = rng.int(1, 60) * (rate.a ** 3 > 1000 ? 10 : 100);
    const S = D(c * rate.b * H);
    const X = D(c * rate.a ** 3);
    if (S.lt(100000) || S.gt(5000000)) return null;
    const k = kOf(rate.r);
    const answer = S.mul(k.pow(3)).div(
      k
        .pow(2)
        .add(k.mul(q))
        .add(q * q),
    );
    // солвер: долг после трёх платежей линеен по первому платежу
    const rest = (x: Drob) => byPayments(S, [x, x.mul(q), x.mul(q * q)], rate.r)[2]!.end;
    const r0 = rest(D(0));
    const verify = r0.div(r0.sub(rest(D(1))));
    const rows = byPayments(S, [X, X.mul(q), X.mul(q * q)], rate.r);
    const qWord = q === 2 ? 'вдвое' : 'втрое';
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} на сумму ${money(S, 'rub')}. ${frameEnd(plot, 'year', D(rate.r))} ` +
        `Известно, что кредит погашен за три года, причём каждый следующий платёж был ровно ${qWord} больше предыдущего. Какую сумму ${plot.firm ? 'компания заплатила' : `${plot.subject} ${v(plot, 'заплатил', 'заплатила')}`} в первый раз? Ответ дайте в рублях.`,
      answer,
      verify,
      params: { S: S.toNumber(), r: Number(rate.r), q },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        stK(rate),
        stTable(`Первый платёж $X$, второй $${q}X$, третий $${q * q}X$.`),
        step(
          'Записываем цепочку',
          'После третьего платежа долг равен нулю.',
          `((Sk - X)k - ${q}X)k - ${q * q}X = 0`,
        ),
        step(
          'Раскрываем скобки',
          'Все платежи — в правую часть.',
          `Sk^3 = X(k^2 + ${q}k + ${q * q})`,
        ),
        step(
          'Находим первый платёж',
          'Подставляем $k$ и сокращаем.',
          `X = \\frac{Sk^3}{k^2 + ${q}k + ${q * q}} = \\frac{${tex(S)}\\cdot ${tex(k.pow(3))}}{${tex(
            k
              .pow(2)
              .add(k.mul(q))
              .add(q * q),
          )}} = ${tex(answer)}`,
        ),
        stAnswer(`Первый платёж — ${money(answer, 'rub')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Какие платежи?',
          `$X$, $${q}X$, $${q * q}X$`,
          [`$X$, $${q}X$, $${q + 1}X$`, `$X$, $X$, $X$`],
          rng.int(0, 2),
          `Каждый следующий в ${q === 2 ? 'два' : 'три'} раза больше предыдущего.`,
        ),
      ]),
    };
  },
};

const C07: Prototype = {
  id: 'C-07',
  type: 'C',
  subtype: 'В10',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2015',
  difficulty: 'hard',
  units: 'years',
  title: 'Минимальный срок при ограничении на платёж',
  forbid: [
    { S: 1300000, r: 10, N: 350000 },
    { S: 100000, r: 10, N: 24000 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20]);
    const k = kOf(rate.r);
    const S = D(rng.int(5, 40) * 100000);
    const n0 = rng.int(3, 7);
    const Xn = annuityX(S, k, n0);
    const Xprev = annuityX(S, k, n0 - 1);
    const N = D(Xn.div(10000).ceil() * 10000n);
    if (!N.lt(Xprev)) return null;
    // формула: Skⁿ(k − 1) ≤ N(kⁿ − 1) ⇔ kⁿ ≥ N / (N − S(k − 1))
    const bound = N.div(N.sub(S.mul(k.sub(1))));
    if (!bound.isPositive()) return null;
    let nf = 0;
    for (let n = 1; n <= 40 && !nf; n++) if (!k.pow(n).lt(bound)) nf = n;
    let ns = 0;
    for (let n = 1; n <= 40 && !ns; n++) if (!equalPayment(S, n, rate.r).gt(N)) ns = n;
    if (nf !== n0) return null;
    const pays = Array.from({ length: n0 }, () => equalPayment(S, n0, rate.r));
    const rows = byPayments(S, pays, rate.r);
    return {
      condition: `${frameJan(plot, `на сумму ${money(S, 'rub')}`, D(rate.r))}\nНа какое минимальное количество лет можно взять кредит при условии, что ежегодные выплаты будут не более ${money(N, 'rub')}?`,
      answer: D(n0),
      verify: D(ns),
      params: { S: S.toNumber(), r: Number(rate.r), N: N.toNumber() },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n0),
      solution: [
        stK(rate),
        stTable(
          `Чем больше лет, тем меньше платёж. Ищем наименьший срок $n$, при котором платежи не превосходят ${num(N)} рублей.`,
        ),
        step(
          'Неравенство',
          'При равных платежах $N$ за $n$ лет долг не должен остаться: в скобках — геометрическая прогрессия.',
          `Sk^n \\le N(k^{n-1} + \\dots + 1) = N\\cdot\\frac{k^n - 1}{k - 1}`,
        ),
        step(
          'Выражаем $k^n$',
          'Собираем $k^n$ в одной части.',
          `k^n\\big(N - S(k - 1)\\big) \\ge N \\;\\Rightarrow\\; k^n \\ge \\frac{${tex(N)}}{${tex(N.sub(S.mul(k.sub(1))))}}`,
        ),
        step(
          'Перебираем степени',
          `Считаем степени $k = ${tex(k)}$, пока не превзойдём правую часть.`,
          `k^{${n0 - 1}} = ${tex(k.pow(n0 - 1))} < ${tex(bound.isFiniteDecimal() && bound.decimals() <= 4 ? bound : D(bound.mul(10000).floor()).div(10000))}${bound.isFiniteDecimal() && bound.decimals() <= 4 ? '' : '\\ldots'} \\le ${tex(k.pow(n0))} = k^{${n0}}`,
        ),
        stAnswer(`Минимальный срок — ${years(n0)}.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Что проверить, чтобы ответ был наименьшим?',
          `Что за ${n0 - 1} ${plural(n0 - 1, 'год', 'года', 'лет')} уложиться в платёж нельзя`,
          ['Что за 1 год уложиться можно', 'Ничего: подходит любой срок'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const C08: Prototype = {
  id: 'C-08',
  type: 'C',
  subtype: 'В5',
  source: 'fipi',
  sourceNote: 'по задачам ЕГЭ-2017 и ЕГЭ-2020',
  difficulty: 'base',
  units: 'percent',
  title: 'Известны два платежа — найти ставку',
  forbid: [
    { S: 300000, x1: 260000, x2: 169000 },
    { S: 400000, x1: 330000, x2: 121000 },
    { S: 250000, x1: 150000, x2: 180000 },
    { S: 200000, x1: 130000, x2: 150000 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25, R30, R50, R15]);
    const k = kOf(rate.r);
    const S = D(rng.int(10, 90) * 10000);
    const x1 = D(rng.int(2, 9) * 10000).add(S.mul(k.sub(1)).mul(rng.pick([0, 1])));
    const x2 = S.mul(k).sub(x1).mul(k);
    if (
      !x2.isInteger() ||
      !x2.isPositive() ||
      x1.lt(S.mul(k).mul('0.3')) ||
      x1.gt(S.mul(k).mul('0.8'))
    )
      return null;
    // формула: S·k² − x1·k − x2 = 0, k > 0
    const disc = x1.mul(x1).add(S.mul(x2).mul(4));
    const sqrtD = S.mul(2).mul(k).sub(x1); // кандидат на √D; проверяем возведением в квадрат
    if (!sqrtD.isPositive() || !disc.eq(sqrtD.pow(2))) return null;
    const kf = x1.add(sqrtD).div(S.mul(2));
    const answer = kf.sub(1).mul(100);
    let found = D(0);
    for (let t = 1; t <= 200; t++)
      if (byPayments(S, [x1, x2], D(t, 2))[1]!.end.eq(0)) found = D(t, 2);
    const rows = byPayments(S, [x1, x2], rate.r);
    const root2 = x1.sub(sqrtD).div(S.mul(2));
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} на сумму ${money(S, 'rub')} под $r$ % годовых и ${v(plot, 'выплатил', 'выплатила')} его за два года: в первый год ${money(x1, 'rub')}, во второй — ${money(x2, 'rub')}. ` +
        `Каждый платёж вносился после начисления процентов на оставшуюся сумму долга. Найдите $r$.`,
      answer,
      verify: found,
      params: { S: S.toNumber(), x1: x1.toNumber(), x2: x2.toNumber() },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        step(
          'Вводим коэффициент',
          '$k = 1 + \\dfrac{r}{100}$ — увеличивающий коэффициент, его и ищем.',
          'k = 1 + \\frac{r}{100}',
        ),
        stTable('Считаем в тысячах рублей: так короче.'),
        step(
          'Записываем цепочку',
          'После второго платежа долг равен нулю.',
          `(${tex(S.div(1000))}k - ${tex(x1.div(1000))})k - ${tex(x2.div(1000))} = 0`,
        ),
        step(
          'Квадратное уравнение',
          'Раскрываем скобки.',
          `${tex(S.div(1000))}k^2 - ${tex(x1.div(1000))}k - ${tex(x2.div(1000))} = 0`,
        ),
        step(
          'Выбираем корень',
          `Дискриминант — полный квадрат. Второй корень отрицательный (${tex(root2).replace('{,}', ',')}), а $k > 1$, поэтому подходит только положительный.`,
          `k = \\frac{${tex(x1.div(1000))} + ${tex(sqrtD.div(1000))}}{${tex(S.mul(2).div(1000))}} = ${tex(kf)} \\;\\Rightarrow\\; r = ${tex(answer)}`,
        ),
        stAnswer(`$r = ${tex(answer)}$.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Какой корень квадратного уравнения выбрать?',
          'Положительный: $k = 1 + \\dfrac{r}{100} > 1$',
          ['Отрицательный', 'Любой из двух'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const C11: Prototype = {
  id: 'C-11',
  type: 'C',
  subtype: 'В8',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2017',
  difficulty: 'hard',
  units: 'percent',
  title: 'По $X$ за 4 (3) года или по $Y$ за 2 — найти ставку',
  forbid: [
    { X: 58564, Y: 106964 },
    { X: 38016, Y: 52416 },
    { X: 2073600, Y: 3513600 },
    { X: 77760, Y: 131760 },
    { X: 1464100, Y: 2674100 },
  ],
  make({ rng, plot }) {
    const n = rng.pick([4, 3]);
    const rate = rng.pick(n === 4 ? [R10, R20, R25] : [R10, R20, R25, R125]);
    const unit = lcm(rate.b * geo(rate.a, rate.b, n), rate.b * geo(rate.a, rate.b, 2));
    const c = rng.int(1, 60) * (unit < 1000 ? 100 : unit < 20000 ? 10 : 1);
    const S = D(unit * c);
    if (S.lt(100000) || S.gt(20000000)) return null;
    const k = kOf(rate.r);
    const X = annuityX(S, k, n);
    const Y = annuityX(S, k, 2);
    if (!X.isInteger() || !Y.isInteger()) return null;
    // формула: n = 4: Y/X = (k² + 1)/k²; n = 3: Y/X = 1 + 1/(k² + k)
    let kf: Drob;
    if (n === 4) {
      const q = X.div(Y.sub(X)); // k² = X / (Y − X)
      kf = k.pow(2).eq(q) ? k : D(0);
    } else {
      const t = X.div(Y.sub(X)); // k² + k = X / (Y − X)
      kf = k.pow(2).add(k).eq(t) ? k : D(0);
    }
    const answer = kf.sub(1).mul(100);
    let found = D(0);
    for (let t = 1; t <= 200; t++) {
      const rr = D(t, 2);
      if (X.div(equalPayment(1, n, rr)).eq(Y.div(equalPayment(1, 2, rr)))) found = rr;
    }
    const rows = byPayments(
      S,
      Array.from({ length: n }, () => X),
      rate.r,
    );
    const solution =
      n === 4
        ? [
            step(
              'Вводим коэффициент',
              '$k = 1 + \\dfrac{r}{100}$ — увеличивающий коэффициент, сумма кредита $S$ неизвестна.',
              'k = 1 + \\frac{r}{100}',
            ),
            stTable('Две схемы с одной и той же суммой $S$: четыре платежа по $X$ и два по $Y$.'),
            step(
              'Два уравнения',
              'Раскрываем скобки в обеих цепочках.',
              `Sk^4 = X(k^2 + 1)(k + 1), \\qquad Sk^2 = Y(k + 1)`,
            ),
            step(
              'Делим одно на другое',
              'Сокращаются $S$ и $(k + 1)$.',
              `k^2 = \\frac{X}{Y}\\,(k^2 + 1) \\;\\Rightarrow\\; \\frac{k^2 + 1}{k^2} = \\frac{Y}{X} = \\frac{${tex(Y)}}{${tex(X)}}`,
            ),
            step(
              'Замена $q = k^2$',
              'Получаем линейное уравнение.',
              `1 + \\frac{1}{q} = \\frac{${tex(Y)}}{${tex(X)}} \\;\\Rightarrow\\; q = \\frac{${tex(X)}}{${tex(Y.sub(X))}} = ${tex(k.pow(2))}`,
            ),
            step(
              'Находим ставку',
              '$k > 0$, извлекаем корень.',
              `k = ${tex(k)} \\;\\Rightarrow\\; r = ${tex(answer)}`,
            ),
            stAnswer(`$r = ${tex(answer)}$.`),
          ]
        : [
            step(
              'Вводим коэффициент',
              '$k = 1 + \\dfrac{r}{100}$ — увеличивающий коэффициент, сумма кредита $S$ неизвестна.',
              'k = 1 + \\frac{r}{100}',
            ),
            stTable('Две схемы с одной и той же суммой $S$: три платежа по $X$ и два по $Y$.'),
            step(
              'Два уравнения',
              'Раскрываем скобки в обеих цепочках.',
              `Sk^3 = X(k^2 + k + 1), \\qquad Sk^2 = Y(k + 1)`,
            ),
            step(
              'Делим одно на другое',
              'Сокращается $S$.',
              `k = \\frac{X(k^2 + k + 1)}{Y(k + 1)} \\;\\Rightarrow\\; \\frac{Y}{X} = \\frac{k^2 + k + 1}{k^2 + k} = 1 + \\frac{1}{k^2 + k}`,
            ),
            step(
              'Находим $k^2 + k$',
              'Подставляем числа.',
              `k^2 + k = \\frac{${tex(X)}}{${tex(Y.sub(X))}} = ${tex(k.pow(2).add(k))}`,
            ),
            step(
              'Квадратное уравнение',
              'Положительный корень — нужный: $k > 1$.',
              `k^2 + k - ${tex(k.pow(2).add(k))} = 0 \\;\\Rightarrow\\; k = ${tex(k)},\\; r = ${tex(answer)}`,
            ),
            stAnswer(`$r = ${tex(answer)}$.`),
          ];
    return {
      condition:
        `${frameJan(plot, 'на некоторую сумму', '$r$ %')}\n` +
        `Если ежегодно выплачивать по ${money(X, 'rub')}, то кредит будет полностью погашен за ${years(n)}, а если ежегодно выплачивать по ${money(Y, 'rub')}, то кредит будет полностью погашен за 2 года. Найдите $r$.`,
      answer,
      verify: found,
      params: { X: X.toNumber(), Y: Y.toNumber(), n },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, n),
      solution,
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Как избавиться от неизвестной суммы кредита?',
          'Разделить одно уравнение на другое',
          ['Сложить уравнения', 'Принять $S = 1$ и подставить числа'],
          rng.int(0, 2),
          'При делении $S$ сокращается, остаётся уравнение только на $k$.',
        ),
      ]),
    };
  },
};

const C12: Prototype = {
  id: 'C-12',
  type: 'C',
  subtype: 'В1',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'Два равных платежа 31 декабря — найти платёж',
  forbid: [
    { S: 4290000, r: 14.5 },
    { S: 4300000, r: 15 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25, R125, R30, R50, R15]);
    const unit = rate.b * (rate.a + rate.b);
    const c = rng.int(1, 200) * (unit < 100 ? 1000 : unit < 1000 ? 100 : 10);
    const S = D(unit * c);
    if (S.lt(500000) || S.gt(9000000)) return null;
    const k = kOf(rate.r);
    const answer = S.mul(k.pow(2)).div(k.add(1));
    if (!answer.isInteger()) return null;
    const Xs = equalPayment(S, 2, rate.r);
    const rows = byPayments(S, [Xs, Xs], rate.r);
    const y = plot.year - 1;
    return {
      condition:
        `31 декабря ${y} года ${plot.subject} ${v(plot, 'взял', 'взяла')} в банке ${money(S, 'rub')} в кредит под ${pct(D(rate.r))} годовых ${plot.goal}. ` +
        `Схема выплаты кредита следующая: 31 декабря каждого следующего года банк начисляет проценты на оставшуюся сумму долга (то есть увеличивает долг на ${pct(D(rate.r))}), затем ${plot.firm ? 'компания переводит' : `${plot.subject} переводит`} в банк $X$ рублей. ` +
        `Какой должна быть сумма $X$, чтобы долг был выплачен двумя равными платежами (то есть за два года)?`,
      answer,
      verify: Xs,
      params: { S: S.toNumber(), r: Number(rate.r) },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(y, 2),
      solution: [
        stK(rate),
        stTable('Два года: долг $\\cdot\\, k$, минус $X$ — и так дважды.'),
        stChain(2),
        stOpen(2),
        step(
          'Находим $X$',
          'Подставляем $k$ дробью и сокращаем.',
          `X = \\frac{Sk^2}{k + 1} = \\frac{${tex(S)}\\cdot ${tex(k.pow(2))}}{${tex(k.add(1))}} = ${tex(answer)}`,
        ),
        stAnswer(`$X = ${tex(answer)}$ рублей.`),
      ],
      hints: hintsC(rng.int(0, 2), [hintChain(2, rng.int(0, 2))]),
    };
  },
};

const C13: Prototype = {
  id: 'C-13',
  type: 'C',
  subtype: 'В2',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'Три равных платежа — переплата',
  forbid: [
    { S: 910, r: 20 },
    { S: 244, r: 25 },
    { S: 122, r: 25 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25, R50]);
    const G = geo(rate.a, rate.b, 3);
    const den = rate.a ** 3 > 1000 ? 10 : 1;
    const m = rng.int(1, 40);
    const S = D(rate.b * G * m, den);
    const X = D(rate.a ** 3 * m, den);
    if (S.lt(100) || S.gt(5000) || !isNice(S, 1)) return null;
    const k = kOf(rate.r);
    const answer = annuityX(S, k, 3).mul(3).sub(S);
    const Xs = equalPayment(S, 3, rate.r);
    const rows = byPayments(S, [Xs, Xs, Xs], rate.r);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} в банке кредит ${plot.goal} в размере ${money(S, 'thous')} под ${pct(D(rate.r))} годовых. ` +
        `Долг нужно погасить тремя равными ежегодными платежами; каждый платёж вносится после начисления процентов на оставшуюся сумму долга. Сколько тысяч рублей сверх суммы кредита придётся выплатить банку?`,
      answer,
      verify: totalPaid(rows).sub(S),
      params: { S: S.toNumber(), r: Number(rate.r) },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        stK(rate),
        stTable('Считаем в тысячах рублей.'),
        stChain(3),
        stOpen(3),
        step(
          'Находим платёж',
          'Подставляем $k$ дробью.',
          `X = \\frac{Sk^3}{k^2 + k + 1} = \\frac{${tex(S)}\\cdot ${tex(k.pow(3))}}{${tex(sumK(k, 3))}} = ${tex(X)}`,
        ),
        step(
          'Переплата',
          'Всё, что отдали, минус то, что взяли.',
          `3X - S = ${tex(X.mul(3))} - ${tex(S)} = ${tex(answer)}`,
        ),
        stAnswer(`Сверх суммы кредита — ${money(answer, 'thous')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Как найти переплату?',
          '$3X - S$',
          ['$3X$', '$X - S$'],
          rng.int(0, 2),
          '«Сверх суммы кредита» — значит, из всех выплат вычитаем кредит.',
        ),
      ]),
    };
  },
};

const C14: Prototype = {
  id: 'C-14',
  type: 'C',
  subtype: 'В6',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'Известны три платежа — найти сумму кредита',
  forbid: [
    { x: 300000, y: 417600, r: 20 },
    { x: 400000, y: 407000, r: 10 },
  ],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25]);
    const k = kOf(rate.r);
    const S = D(rng.int(30, 300) * 10000);
    const x = D(rng.int(10, 150) * 10000);
    const y = S.mul(k).sub(x).mul(k).sub(x).mul(k);
    if (
      !y.isInteger() ||
      !y.isPositive() ||
      y.lt(x.div(2)) ||
      y.gt(x.mul(2)) ||
      !S.mul(k).sub(x).isPositive()
    )
      return null;
    const answer = x.mul(k.pow(2).add(k)).add(y).div(k.pow(3));
    // солвер: долг после трёх платежей линеен по S
    const rest = (s: Drob) => byPayments(s, [x, x, y], rate.r)[2]!.end;
    const a0 = rest(D(0));
    const a1 = rest(D(1));
    const verify = a0.neg().div(a1.sub(a0));
    const rows = byPayments(S, [x, x, y], rate.r);
    return {
      condition: `${frameJan(plot, '', D(rate.r))}\nНайдите сумму кредита, если он будет полностью выплачен за три года, причём в первый и второй годы будет выплачено по ${money(x, 'rub')}, а в третий — ${money(y, 'rub')}. Ответ дайте в рублях.`,
      answer,
      verify,
      params: { x: x.toNumber(), y: y.toNumber(), r: Number(rate.r) },
      rows,
      scheme: 'ann',
      period: 'year',
      labels: yearLabels(plot.year, 3),
      solution: [
        stK(rate),
        stTable('Сумму кредита обозначим $S$, платежи известны.'),
        step(
          'Записываем цепочку',
          'После третьего платежа долг равен нулю.',
          `((Sk - ${tex(x)})k - ${tex(x)})k - ${tex(y)} = 0`,
        ),
        step(
          'Раскрываем скобки',
          'Неизвестное — в левую часть.',
          `Sk^3 = ${tex(x)}(k^2 + k) + ${tex(y)}`,
        ),
        step(
          'Находим $S$',
          'Считаем в тысячах и делим на $k^3$.',
          `S = \\frac{${tex(x.div(1000))}\\cdot ${tex(k.pow(2).add(k))} + ${tex(y.div(1000))}}{${tex(k.pow(3))}} = ${tex(answer.div(1000))}\\ \\text{тыс.}`,
        ),
        stAnswer(`Сумма кредита — ${money(answer, 'rub')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Какое уравнение получается?',
          `$((Sk - x)k - x)k - y = 0$`,
          ['$S - 2x - y = 0$', '$((S - x)k - x)k - y = 0$'],
          rng.int(0, 2),
          'Проценты начисляются до каждого платежа — и до первого тоже.',
        ),
      ]),
    };
  },
};

const C16: Prototype = {
  id: 'C-16',
  type: 'C',
  subtype: 'В11',
  source: 'own',
  sourceNote: 'авторская (по А. Малковой)',
  difficulty: 'hard',
  units: 'thous',
  title: 'Платёж при другом сроке',
  forbid: [{ X: 738, r: 25 }],
  make({ rng, plot }) {
    const rate = rng.pick([R10, R20, R25]);
    const base = (rate.a ** 2 + rate.b ** 2) * (rate.a + rate.b);
    const c = rng.int(1, 12) * (base > 1000 ? 1 : 1);
    const X = D(base * c).div(base > 1000 ? 10 : 1);
    const Y = D(rate.a * (rate.a ** 2 + rate.a * rate.b + rate.b ** 2) * c).div(
      base > 1000 ? 10 : 1,
    );
    if (X.lt(50) || X.gt(3000) || !isNice(X, 1) || !isNice(Y, 1)) return null;
    const k = kOf(rate.r);
    const S = X.mul(sumK(k, 3)).div(k.pow(3));
    const answer = S.mul(k.pow(4)).div(k.pow(2).add(1).mul(k.add(1)));
    const Ss = X.div(equalPayment(1, 3, rate.r));
    const Ys = equalPayment(Ss, 4, rate.r);
    const rows = byPayments(Ss, [Ys, Ys, Ys, Ys], rate.r);
    return {
      condition:
        `${plot.subject} берёт кредит ${plot.goal} под ${pct(D(rate.r))} годовых. ${plot.firm ? 'Компания рассчитала' : v(plot, 'Он рассчитал', 'Она рассчитала')}, что если выплачивать кредит ежегодными равными платежами по ${money(X, 'thous')}, кредит будет полностью выплачен за 3 года. ` +
        `Какими должны быть ежегодные платежи, чтобы выплатить кредит за 4 года? Каждый платёж вносится после начисления процентов. Ответ дайте в тысячах рублей.`,
      answer,
      verify: Ys,
      params: { X: X.toNumber(), r: Number(rate.r) },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        stK(rate),
        stTable('Таблица — для погашения за 4 года.'),
        step(
          'Срок 3 года',
          'Цепочка из трёх звеньев даёт сумму кредита через $X$.',
          `Sk^3 = X(k^2 + k + 1) \\;\\Rightarrow\\; S = \\frac{X(k^2 + k + 1)}{k^3}`,
        ),
        step(
          'Срок 4 года',
          'Цепочка из четырёх звеньев с новым платежом $Y$.',
          `Sk^4 = Y(k^2 + 1)(k + 1)`,
        ),
        step(
          'Подставляем $S$',
          'Сумму кредита не считаем отдельно.',
          `Y = \\frac{Xk(k^2 + k + 1)}{(k^2 + 1)(k + 1)} = \\frac{${tex(X)}\\cdot ${tex(k)}\\cdot ${tex(sumK(k, 3))}}{${tex(k.pow(2).add(1))}\\cdot ${tex(k.add(1))}} = ${tex(answer)}`,
        ),
        stAnswer(`Платежи по ${money(answer, 'thous')}.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'Что общего у двух схем?',
          'Одна и та же сумма кредита $S$',
          ['Один и тот же платёж', 'Одна и та же переплата'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

/** Число для KaTeX: конечная дробь — десятичной записью, иначе обыкновенной. */
const fr = (x: Drob): string => (x.isFiniteDecimal() ? tex(x) : `\\frac{${x.n}}{${x.d}}`);
const C17: Prototype = {
  id: 'C-17',
  type: 'C',
  subtype: 'В12',
  source: 'own',
  sourceNote: 'авторская (по А. Малковой)',
  difficulty: 'hard',
  units: 'percent',
  maxDecimals: 3,
  title: 'Смена ставки по ходу кредита — последний платёж в процентах от суммы',
  forbid: [{ r1: 25, r2: 20, h: 50 }],
  make({ rng, plot }) {
    const share = rng.pick([
      { h: D(1, 2), word: 'половину' },
      { h: D(2, 5), word: 'две пятых' },
      { h: D(1, 3), word: 'треть' },
      { h: D(3, 10), word: 'три десятых' },
    ]);
    const h = share.h;
    const r1 = rng.pick([10, 15, 20, 25, 30, 40, 50]);
    const r2 = rng.pick([5, 10, 15, 20, 25, 30, 40].filter((x) => x < r1));
    const k1 = kOf(r1);
    const k2 = kOf(r2);
    // формула: долг после трёх платежей d3 = k2(k1(k1 − h) − h) − h, четвёртый платёж k2·d3 (в долях S), h — доля платежа
    const d3 = k2.mul(k1.mul(k1.sub(h)).sub(h)).sub(h);
    const p4 = k2.mul(d3);
    if (!d3.isPositive() || !p4.lt(h)) return null;
    const answer = p4.mul(100);
    if (!isNice(answer, 3)) return null;
    const rows3 = byPayments(1, [h, h, h], [r1, r1, r2]);
    const last = rows3[2]!.end.mul(k2);
    const hp = h.mul(100);
    const rows = byPayments(100, [hp, hp, hp, last.mul(100)], [r1, r1, r2, r2]);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal}, рассчитывая погасить долг ежегодными платежами, каждый из которых (кроме, возможно, последнего) составляет ${share.word} суммы $S$, взятой в кредит. ` +
        `В конце каждого года банк увеличивает оставшуюся сумму долга на ${pct(r1)}, а затем ${plot.firm ? 'компания переводит' : `${plot.subject} переводит`} в банк очередной платёж. После двух лет выплат банк снизил процентную ставку до ${pct(r2)} годовых, и был внесён третий платёж. Четвёртым платежом долг был погашен полностью. ` +
        `Сколько процентов от суммы $S$ составил четвёртый платёж?`,
      answer,
      verify: last.mul(100),
      params: { r1, r2, h: h.mul(100).toNumber() },
      rows,
      scheme: 'ann',
      period: 'year',
      solution: [
        step(
          'Вводим коэффициенты',
          'До снижения ставки долг каждый год растёт в $k_1$ раз, после — в $k_2$ раз.',
          `k_1 = 1 + \\frac{${r1}}{100} = ${tex(k1)}, \\qquad k_2 = 1 + \\frac{${r2}}{100} = ${tex(k2)}`,
        ),
        stTable(`Считаем в долях кредита $S$: первые три платежа по $${fr(h)}\\,S$.`),
        step(
          'Два года по старой ставке',
          `Долг умножаем на $k_1$, вычитаем платёж — ${share.word} кредита.`,
          `(${tex(k1)}S - ${fr(h)}S)\\cdot ${tex(k1)} - ${fr(h)}S = ${fr(k1.mul(k1.sub(h)).sub(h))}\\,S`,
        ),
        step(
          'Третий год по новой ставке',
          'Теперь умножаем на $k_2$.',
          `${fr(k1.mul(k1.sub(h)).sub(h))}\\,S\\cdot ${tex(k2)} - ${fr(h)}S = ${fr(d3)}\\,S`,
        ),
        step(
          'Четвёртый платёж',
          'Последний платёж гасит долг с процентами целиком.',
          `${fr(d3)}\\,S\\cdot ${tex(k2)} = ${fr(p4)}\\,S`,
        ),
        stAnswer(`Четвёртый платёж — ${pct(answer)} от $S$.`),
      ],
      hints: hintsC(rng.int(0, 2), [
        choice(
          'На какой коэффициент умножать долг в третий год?',
          `$k_2 = ${tex(k2)}$ — ставка уже снижена`,
          [`$k_1 = ${tex(k1)}$`, '$1$'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

export const PROTO_C: Prototype[] = [
  C01,
  makeEqualFour('C-02'),
  C03,
  C04,
  C05,
  C06,
  C07,
  C08,
  makeEqualFour('C-10'),
  C11,
  C12,
  C13,
  C14,
  C16,
  C17,
];
