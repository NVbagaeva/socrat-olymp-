/**
 * Прототипы задания №13: вклады (D-01 … D-13).
 * Список и источники — docs/13-economics/03-prototypes.md.
 *
 * Таблица — формат «Вклад на начало · После начисления % · Пополнение /
 * снятие · Вклад на конец». Ответ считается формулой (цепочка
 * ((Sk + x)k + x)k… с раскрытыми скобками), проверка — солвером
 * `deposit` (прямой пересчёт по годам).
 */

import { D, type Drob, kOf, sum } from '../drob';
import { v } from '../plots';
import { deposit, type Row } from '../solver';
import { money, num, pct, plural, years } from '../text';
import { choice, hintK, hintType, isNice, largestInt, smallestInt, step, tex } from './common';
import { depBukvy } from '../bukvy';
import type { TablitsaPeremennye } from '../types';
import { perenos, raskryto, stChisla, stFormula, stTablitsaBukvy, stUravnenie } from './razbor';
import type { Prototype } from './types';

/* ── Общие куски ──────────────────────────────────────────────── */

const DEP = { kind: 'deposit' as const };

const stTable = (text: string) => step('Составляем таблицу', text, undefined, true);
const stAnswer = (text: string) => step('Ответ', text);

/** Год, в который делается операция «после начисления»: массив длины n. */
const ops = (n: number, at: Record<number, Drob>): Drob[] =>
  Array.from({ length: n }, (_, i) => at[i + 1] ?? D(0));

const last = (rows: Row[]): Drob => rows[rows.length - 1]!.end;

/** «= 46,25» или «≈ 46,28»: граница для целого ответа. */
const granica = (d: Drob): string =>
  d.isFiniteDecimal() && d.decimals() <= 3
    ? `= ${tex(d)}`
    : `\\approx ${tex(D(Math.floor(d.toNumber() * 100)).div(100))}`;

const TEXT_VKLAD =
  'Каждый год вклад на начало умножаем на $k = 1 + \\dfrac{r}{100}$ — получаем вклад после начисления процентов, затем добавляем пополнение или вычитаем снятие — получаем вклад на конец $V_i$.';

/** Сумма k^a + … + k^b (a ≤ b). */
const kSum = (k: Drob, from: number, to: number): Drob => {
  let s = D(0);
  for (let i = from; i <= to; i++) s = s.add(k.pow(i));
  return s;
};

/** «k^4 + k^3 + k^2 + k» для KaTeX. */
const kSumTex = (from: number, to: number): string => {
  const parts: string[] = [];
  for (let i = to; i >= from; i--) parts.push(i === 0 ? '1' : i === 1 ? 'k' : `k^${i}`);
  return parts.join(' + ');
};

const hintMoment = (shift: number) =>
  choice(
    'Пополнение «в начале третьего года» — это когда?',
    'Сразу после начисления процентов за второй год',
    [
      'До начисления процентов за третий год, и проценты на него не начисляются',
      'В конце третьего года, после начисления',
    ],
    shift,
    'Конец второго года и начало третьего — один момент: проценты за второй год уже начислены.',
  );

/* ── D-01, D-02: пополнения, целый вклад ──────────────────────── */

function makeTopUp(id: 'D-01' | 'D-02'): Prototype {
  const interestMode = id === 'D-02';
  return {
    id,
    type: 'D',
    subtype: 'Г2',
    source: 'fipi',
    sourceNote: 'по задаче ЕГЭ-2016',
    difficulty: 'base',
    units: 'mln',
    title: interestMode
      ? 'Наименьший целый вклад, при котором банк начислит больше $N$'
      : 'Наибольший целый вклад при ограничении на итог',
    plot: DEP,
    forbid: interestMode
      ? [{ r: 10, x: 3, N: 5, from: 3 }]
      : [
          { r: 10, x: 2, N: 15, from: 3 },
          { r: 10, x: 3, N: 25, from: 3 },
          { r: 10, x: 1, N: 10, from: 2 },
        ],
    make({ rng, plot }) {
      const r = D(rng.pick(['5', '10', '20', '25']));
      const k = kOf(r);
      const x = D(rng.int(1, 5));
      const from = rng.pick([2, 3]); // пополнения в начале годов from…4
      const at: Record<number, Drob> = {};
      for (let y = from - 1; y <= 3; y++) at[y] = x;
      const count = 4 - from + 1;
      // итог: S·k^4 + x(k^(5−from) + … + k)
      const tail = kSum(k, 1, 4 - from + 1);
      const fin = (S: number) => D(S).mul(k.pow(4)).add(x.mul(tail));
      const S0 = rng.int(3, 20);
      let N: Drob;
      let answer: number | null;
      let verify: number | null;
      if (!interestMode) {
        N = D(fin(S0).floor() + 1n);
        if (N.gt(fin(S0 + 1))) return null;
        answer = largestInt((S) => fin(S).lt(N), 1, 200);
        verify = largestInt((S) => last(deposit(S, 4, r, { after: ops(4, at) })).lt(N), 1, 200);
      } else {
        const earned = (S: number) => fin(S).sub(S).sub(x.mul(count));
        N = D(earned(S0).floor());
        if (N.eq(earned(S0))) N = N.sub(1);
        if (N.lt(earned(S0 - 1))) return null;
        answer = smallestInt((S) => earned(S).gt(N), 1, 200);
        verify = smallestInt(
          (S) =>
            last(deposit(S, 4, r, { after: ops(4, at) }))
              .sub(S)
              .sub(x.mul(count))
              .gt(N),
          1,
          200,
        );
      }
      if (answer === null || verify === null || answer !== S0) return null;
      const startWord = from === 2 ? 'второго, третьего и четвёртого' : 'третьего и четвёртого';
      const deystviya = [1, 2, 3, 4].map((g) => (at[g] ? '+ y' : ''));
      const rows = deposit(S0, 4, r, { after: ops(4, at) });
      const ask = interestMode
        ? `Найдите наименьший размер первоначального вклада, при котором банк за четыре года начислит на вклад больше ${money(N, 'mln')}.`
        : `Найдите наибольший размер первоначального вклада, при котором через четыре года вклад будет меньше ${money(N, 'mln')}.`;
      return {
        condition:
          `${plot.subject} ${v(plot, 'открывает', 'открывает')} вклад ${plot.goal} на четыре года. Первоначальный вклад составляет целое число миллионов рублей. ` +
          `В конце каждого года вклад увеличивается на ${pct(r)} по сравнению с его размером в начале года, а кроме этого, в начале ${startWord} годов вклад пополняется на ${money(x, 'mln')}. ${ask}`,
        answer: D(answer),
        verify: D(verify),
        params: { r: r.toNumber(), x: x.toNumber(), N: N.toNumber(), from },
        rows,
        scheme: 'dep',
        period: 'year',
        solution: [
          stTablitsaBukvy(
            `${TEXT_VKLAD} Пополнение $y$ «в начале года» — сразу после начисления процентов за предыдущий год.`,
          ),
          stUravnenie(deystviya, {
            D: 'V',
            nol: false,
            title: 'Записываем вклад через четыре года',
          }),
          step(
            'Выносим $y$ за скобку',
            'Пополнения собираем в одно слагаемое.',
            `V_{4} = ${raskryto(deystviya)} = Sk^{4} + y(${kSumTex(1, count)})`,
          ),
          interestMode
            ? step(
                'Составляем неравенство',
                'Начисленные проценты — вклад через четыре года минус первоначальный вклад и минус все пополнения.',
                `Sk^{4} + y(${kSumTex(1, count)}) - S - ${count}y > N`,
              )
            : step(
                'Составляем неравенство',
                'Вклад через четыре года должен быть меньше $N$.',
                `Sk^{4} + y(${kSumTex(1, count)}) < N`,
              ),
          interestMode
            ? stFormula(
                'Собираем $S$ в левой части и делим на $k^4 - 1 > 0$.',
                `S > \\dfrac{N + ${count}y - y(${kSumTex(1, count)})}{k^{4} - 1}`,
              )
            : stFormula(
                'Переносим пополнения вправо и делим на $k^4$.',
                `S < \\dfrac{N - y(${kSumTex(1, count)})}{k^{4}}`,
              ),
          stChisla(
            `Считаем в миллионах рублей: $y = ${tex(x)}$, $N = ${tex(N)}$.`,
            [
              `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}, \\qquad k^{4} = ${tex(k.pow(4))}, \\qquad ${kSumTex(1, count)} = ${tex(tail)}`,
              interestMode
                ? `S > \\dfrac{${tex(N)} + ${tex(x.mul(count))} - ${tex(x.mul(tail))}}{${tex(k.pow(4).sub(1))}} ${granica(N.add(x.mul(count)).sub(x.mul(tail)).div(k.pow(4).sub(1)))}`
                : `S < \\dfrac{${tex(N)} - ${tex(x.mul(tail))}}{${tex(k.pow(4))}} ${granica(N.sub(x.mul(tail)).div(k.pow(4)))}`,
            ],
            interestMode
              ? `Наименьшее целое — $S = ${S0}$: при $S = ${S0 - 1}$ банк начислит не больше ${num(N)} млн.`
              : `Наибольшее целое — $S = ${S0}$: при $S = ${S0 + 1}$ вклад уже не меньше ${num(N)} млн.`,
          ),
          stAnswer(`${S0} млн рублей.`),
        ],
        hints: [hintType('D', rng.int(0, 2)), hintMoment(rng.int(0, 2)), hintK(rng.int(0, 2))],
      };
    },
  };
}

/* ── D-03: проект с двумя контрольными точками ─────────────────── */

const D03: Prototype = {
  id: 'D-03',
  type: 'D',
  subtype: 'Г3',
  source: 'fipi',
  difficulty: 'base',
  units: 'mln',
  title: 'Проект: наименьшие вложения при двух контрольных точках',
  plot: DEP,
  forbid: [
    { r: 20, a: 20, b: 10, N1: 100, N2: 170 },
    { r: 40, a: 40, b: 20, N1: 270, N2: 490 },
    { r: 20, a: 10, b: 5, N1: 70, N2: 120 },
    { r: 20, a: 20, b: 10, N1: 150, N2: 250 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25', '30', '40']));
    const k = kOf(r);
    const a = D(rng.pick([5, 10, 15, 20, 30, 40]));
    const b = D(rng.pick([5, 10, 15, 20]).toString());
    if (b.gt(a)) return null;
    const at = { 1: a, 2: a, 3: b, 4: b };
    const B2 = (S: number) => D(S).mul(k.pow(2)).add(a.mul(k)).add(a);
    const B4 = (S: number) => B2(S).mul(k.pow(2)).add(b.mul(k)).add(b);
    const S0 = rng.int(15, 90);
    let N2 = D(B4(S0).div(10).floor() * 10n);
    if (N2.eq(B4(S0))) N2 = N2.sub(10);
    if (N2.lt(B4(S0 - 1))) {
      N2 = D(B4(S0).floor());
      if (N2.eq(B4(S0))) N2 = N2.sub(1);
      if (N2.lt(B4(S0 - 1))) return null;
    }
    const d = rng.int(2, 6);
    const N1 = D(
      B2(S0 - d)
        .div(10)
        .floor() * 10n,
    );
    if (!N1.isPositive()) return null;
    const ok = (S: number) => B2(S).gt(N1) && B4(S).gt(N2);
    const answer = smallestInt(ok, 1, 400);
    const verify = smallestInt(
      (S) => {
        const rows = deposit(S, 4, r, { after: ops(4, at) });
        return rows[1]!.end.gt(N1) && rows[3]!.end.gt(N2);
      },
      1,
      400,
    );
    if (answer === null || verify === null) return null;
    const s1 = N1.sub(a.mul(k)).sub(a).div(k.pow(2));
    const s2 = N2.sub(b.mul(k))
      .sub(b)
      .sub(a.mul(k).add(a).mul(k.pow(2)))
      .div(k.pow(4));
    return {
      condition:
        `По бизнес-плану ${plot.subject} ${v(plot, 'собирается', 'собирается')} вложить в четырёхлетний проект целое число миллионов рублей. По итогам каждого года планируется прирост средств на ${pct(r)} по сравнению с началом года. Начисленные проценты остаются вложенными в проект. ` +
        `Кроме этого, сразу после начисления процентов нужны дополнительные вложения: по ${money(a, 'mln')} в первый и второй годы и по ${money(b, 'mln')} в третий и четвёртый годы. ` +
        `Найдите наименьший размер первоначальных вложений, при котором сумма средств через два года станет больше ${money(N1, 'mln')}, а через четыре года — больше ${money(N2, 'mln')}.`,
      answer: D(answer),
      verify: D(verify),
      params: {
        r: r.toNumber(),
        a: a.toNumber(),
        b: b.toNumber(),
        N1: N1.toNumber(),
        N2: N2.toNumber(),
      },
      rows: deposit(answer, 4, r, { after: ops(4, at) }),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTablitsaBukvy(
          `${TEXT_VKLAD} Вложения после начисления: $a$ в первый и второй годы, $b$ — в третий и четвёртый.`,
          depBukvy({ n: 4, period: 'year', dobavka: (g) => (g === 'n' || g > 2 ? 'b' : 'a') }),
        ),
        stUravnenie(['+ a', '+ a', '+ b', '+ b'], {
          D: 'V',
          nol: false,
          stroki: [2, 4],
          title: 'Записываем средства через два и через четыре года',
        }),
        {
          title: 'Группируем вложения',
          text: 'Выносим $a$ и $b$ за скобки.',
          bloki: [
            { vid: 'formula', tex: 'V_{2} = Sk^{2} + ak + a = Sk^{2} + a(k + 1)' },
            {
              vid: 'formula',
              tex: 'V_{4} = Sk^{4} + ak^{3} + ak^{2} + bk + b = Sk^{4} + a(k^{3} + k^{2}) + b(k + 1)',
            },
          ],
        },
        step(
          'Составляем неравенства',
          'Через два года — больше $N_{1}$, через четыре — больше $N_{2}$; оба условия сразу.',
          'Sk^{2} + a(k + 1) > N_{1}, \\qquad Sk^{4} + a(k^{3} + k^{2}) + b(k + 1) > N_{2}',
        ),
        stFormula(
          'Выражаем $S$ из каждого неравенства.',
          'S > \\dfrac{N_{1} - a(k + 1)}{k^{2}}, \\qquad S > \\dfrac{N_{2} - a(k^{3} + k^{2}) - b(k + 1)}{k^{4}}',
        ),
        stChisla(
          `Считаем в миллионах рублей: $a = ${tex(a)}$, $b = ${tex(b)}$, $N_{1} = ${tex(N1)}$, $N_{2} = ${tex(N2)}$.`,
          [
            `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}, \\qquad k^{2} = ${tex(k.pow(2))}, \\qquad k^{4} = ${tex(k.pow(4))}`,
            `S > \\dfrac{${tex(N1)} - ${tex(a.mul(k.add(1)))}}{${tex(k.pow(2))}} ${granica(s1)}`,
            `S > \\dfrac{${tex(N2)} - ${tex(a.mul(k.pow(3).add(k.pow(2))))} - ${tex(b.mul(k.add(1)))}}{${tex(k.pow(4))}} ${granica(s2)}`,
          ],
          `Оба условия выполняются начиная с $S = ${answer}$; при $S = ${answer - 1}$ хотя бы одно нарушается.`,
        ),
        stAnswer(`${answer} млн рублей.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Сколько условий нужно выполнить?',
          'Оба сразу: и через два года, и через четыре',
          ['Хватит одного из двух', 'Только условие через четыре года'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-04: проект Ларина, удвоение и утроение ─────────────────── */

const D04: Prototype = {
  id: 'D-04',
  type: 'D',
  subtype: 'Г3',
  source: 'own',
  sourceNote: 'Ларин',
  difficulty: 'hard',
  units: 'mln',
  title: 'Проект: наименьшие целые вложения для удвоения и утроения',
  plot: DEP,
  forbid: [{ S0: 10, r: 15 }],
  make({ rng, plot }) {
    const S0 = rng.int(5, 20);
    const r = D(rng.pick(['10', '15', '20', '25']));
    const k = kOf(r);
    const B2 = (n: number) => D(S0).mul(k.pow(2)).add(D(n).mul(k)).add(n);
    const n = smallestInt((x) => !B2(x).lt(2 * S0), 0, 200);
    if (n === null || n < 1) return null;
    const B4 = (m: number) => B2(n).mul(k.pow(2)).add(D(m).mul(k)).add(m);
    const m = smallestInt((x) => !B4(x).lt(3 * S0), 0, 200);
    if (m === null || m < 1) return null;
    const nV = smallestInt((x) => !deposit(S0, 2, r, { after: [x, x] })[1]!.end.lt(2 * S0), 0, 200);
    const mV =
      nV === null
        ? null
        : smallestInt(
            (x) => !last(deposit(S0, 4, r, { after: [nV, nV, x, x] })).lt(3 * S0),
            0,
            200,
          );
    return {
      condition:
        `По бизнес-плану ${plot.subject} ${v(plot, 'планирует', 'планирует')} изначально вложить в четырёхлетний проект ${money(S0, 'mln')}. По итогам каждого года планируется прирост вложенных средств на ${pct(r)} по сравнению с началом года. Начисленные проценты остаются вложенными в проект. ` +
        `Кроме этого, сразу после начисления процентов нужны дополнительные вложения: по целому числу $n$ млн рублей в первый и второй годы и по целому числу $m$ млн рублей в третий и четвёртый годы. ` +
        `Найдите наименьшие значения $n$ и $m$, при которых первоначальные вложения за два года как минимум удвоятся, а за четыре года как минимум утроятся. В ответ запишите $n + m$.`,
      answer: D(n + m),
      verify: D((nV ?? -100) + (mV ?? -100)),
      params: { S0, r: r.toNumber() },
      rows: deposit(S0, 4, r, { after: [n, n, m, m] }),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(`Считаем в миллионах рублей, $k = ${tex(k)}$.`),
        step(
          'Через два года',
          'Удвоиться — значит стать не меньше $2\\cdot ' + S0 + ' = ' + 2 * S0 + '$.',
          `${S0}k^2 + nk + n \\ge ${2 * S0} \\;\\Rightarrow\\; n \\ge \\frac{${2 * S0} - ${tex(k.pow(2).mul(S0))}}{${tex(k.add(1))}}`,
        ),
        step('Наименьшее $n$', `Правая часть не больше ${n} и больше ${n - 1}.`, `n = ${n}`),
        step(
          'Через четыре года',
          `Подставляем $n = ${n}$; утроиться — стать не меньше ${3 * S0}.`,
          `${tex(B2(n))}\\,k^2 + mk + m \\ge ${3 * S0} \\;\\Rightarrow\\; m \\ge \\frac{${3 * S0} - ${tex(B2(n).mul(k.pow(2)))}}{${tex(k.add(1))}}`,
        ),
        step(
          'Наименьшее $m$',
          `Правая часть не больше ${m} и больше ${m - 1}.`,
          `m = ${m},\\quad n + m = ${n + m}`,
        ),
        stAnswer(`${n + m}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Что значит «как минимум удвоятся»?',
          `Через два года будет не меньше $${2 * S0}$ млн`,
          [
            `Через два года прибавится $${2 * S0}$ млн`,
            `Через два года будет ровно $${S0 * 2}$ млн и не больше`,
          ],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-05: пополнения до заданного процента превышения ────────── */

const D05: Prototype = {
  id: 'D-05',
  type: 'D',
  subtype: 'Г4',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2016',
  difficulty: 'base',
  units: 'rub',
  title: 'Пополнения так, чтобы вклад превышал исходный на заданные проценты',
  plot: DEP,
  forbid: [{ S: 150, r: 20, a: 50, b: 100, c: 180 }],
  make({ rng, plot }) {
    const S = D(rng.int(10, 60) * 10); // тыс.
    const r = D(rng.pick(['10', '20', '25']));
    const k = kOf(r);
    const a = rng.pick([30, 40, 50, 60]);
    const b = a + rng.pick([30, 40, 50, 60, 70]);
    const c = b + rng.pick([50, 60, 70, 80, 90, 100]);
    const t = [a, b, c].map((p) =>
      D(100 + p)
        .div(100)
        .mul(S),
    );
    const x1 = t[0]!.sub(S.mul(k));
    const x2 = t[1]!.sub(t[0]!.mul(k));
    const x3 = t[2]!.sub(t[1]!.mul(k));
    if (!x1.isPositive() || !x2.isPositive() || !x3.isPositive()) return null;
    const answer = x3.mul(1000);
    if (!answer.isInteger()) return null;
    // солвер: по годам доводим вклад до цели
    const xs: Drob[] = [];
    let rows = deposit(S, 3, r, { after: [0, 0, 0] });
    for (let y = 0; y < 3; y++) {
      xs[y] = t[y]!.sub(rows[y]!.afterInterest);
      rows = deposit(S, 3, r, { after: [xs[0] ?? 0, xs[1] ?? 0, xs[2] ?? 0] });
    }
    const y0 = plot.year;
    return {
      condition:
        `Вклад ${plot.goal} в размере ${money(S, 'thous')} открыт в январе ${y0} года. В конце каждого года банк увеличивает вклад на ${pct(r)} по сравнению с его размером в начале года. ` +
        `Кроме того, в январе каждого года, начиная с ${y0 + 1}, ${plot.subject} ${v(plot, 'вносит', 'вносит')} на счёт дополнительные средства так, что в марте ${y0 + 1}, ${y0 + 2} и ${y0 + 3} годов сумма на счёте превышает исходную на ${a}, ${b} и ${c} процентов соответственно. ` +
        `На какую сумму пополнили счёт в ${y0 + 3} году? Ответ выразите в рублях.`,
      answer,
      verify: (xs[2] ?? D(0)).mul(1000),
      params: { S: S.toNumber(), r: r.toNumber(), a, b, c },
      rows,
      scheme: 'dep',
      period: 'year',
      labels: [String(y0), String(y0 + 1), String(y0 + 2)],
      solution: [
        stTable(
          `Считаем в тысячах рублей, $S = ${tex(S)}$, $k = ${tex(k)}$. Пополнение в январе — сразу после начисления процентов за прошлый год.`,
        ),
        step(
          'Что известно',
          `«Превышает исходную на ${b} %» — 100 % здесь исходный вклад, значит, на счёте ${100 + b} % от $S$.`,
          `\\text{март } ${y0 + 2}{:}\\ ${tex(D(100 + b).div(100))}\\,S,\\qquad \\text{март } ${y0 + 3}{:}\\ ${tex(D(100 + c).div(100))}\\,S`,
        ),
        step(
          `Пополнение ${y0 + 3} года`,
          'В конце года вклад умножился на $k$, затем добавили $x$.',
          `${tex(D(100 + b).div(100))}\\,S\\cdot ${tex(k)} + x = ${tex(D(100 + c).div(100))}\\,S \\;\\Rightarrow\\; x = ${tex(
            D(100 + c)
              .div(100)
              .sub(
                D(100 + b)
                  .div(100)
                  .mul(k),
              ),
          )}\\cdot ${tex(S)} = ${tex(x3)}`,
        ),
        step(
          'Переводим в рубли',
          'Считали в тысячах.',
          `${tex(x3)}\\ \\text{тыс.} = ${tex(answer)}\\ \\text{руб.}`,
        ),
        stAnswer(`${money(answer, 'rub')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          `Сколько на счёте в марте ${y0 + 2} года?`,
          `$${tex(D(100 + b).div(100))}\\,S$`,
          [`$${tex(D(b).div(100))}\\,S$`, `$S + ${b}$`],
          rng.int(0, 2),
          `«Превышает на ${b} %» — это ${100 + b} % от исходного вклада.`,
        ),
      ],
    };
  },
};

/* ── D-06: снятия до нуля ─────────────────────────────────────── */

const D06: Prototype = {
  id: 'D-06',
  type: 'D',
  subtype: 'Г5',
  source: 'own',
  sourceNote: 'авторская (зачёт)',
  difficulty: 'base',
  units: 'rub',
  title: 'Снятия одной суммой после каждого начисления до нуля',
  plot: DEP,
  forbid: [{ r: 10, x: 133100, n: 3 }],
  make({ rng, plot }) {
    const n = rng.pick([2, 3, 4]);
    const r = D(rng.pick(['5', '10', '12.5', '15', '20', '25', '50']));
    const k = kOf(r);
    const base = k.pow(n);
    // снятие кратно числителю kⁿ, чтобы вклад вышел целым; от 30 тыс. до 2 млн рублей
    const mMin = Math.ceil(30000 / Number(base.n));
    const mMax = Math.floor(2_000_000 / Number(base.n));
    if (mMax < mMin) return null;
    const x = D(base.n).mul(rng.int(mMin, mMax));
    if (x.lt(30000) || x.gt(2_000_000)) return null;
    const S = x.mul(kSum(k, 0, n - 1)).div(base);
    if (!S.isInteger()) return null;
    const endAt = (s: Drob) =>
      last(deposit(s, n, r, { after: Array.from({ length: n }, () => x.neg()) }));
    const e0 = endAt(D(0));
    const e1 = endAt(D(1));
    const verify = e0.neg().div(e1.sub(e0));
    const w = (i: number) =>
      i === 1 ? 'первого' : i === 2 ? 'второго' : i === 3 ? 'третьего' : 'четвёртого';
    const deystviya = Array.from({ length: n }, () => '- x');
    return {
      condition: `${plot.subject} ${v(plot, 'открыл', 'открыла')} вклад ${plot.goal} под ${pct(r)} годовых. В конце каждого года банк начисляет проценты, после чего со вклада снимают ${money(x, 'rub')}. После ${w(n)} снятия на счёте не осталось денег. Какая сумма была положена на вклад? Ответ дайте в рублях.`,
      answer: S,
      verify,
      params: { r: r.toNumber(), x: x.toNumber(), n },
      rows: deposit(S, n, r, { after: Array.from({ length: n }, () => x.neg()) }),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTablitsaBukvy(`${TEXT_VKLAD} Каждый год снимают одну и ту же сумму $x$.`),
        stUravnenie(deystviya, { D: 'V' }),
        step(
          'Переносим снятия вправо и выносим $x$',
          `Это та же схема, что у аннуитета: вклад «гасится» равными снятиями. В скобках — сумма геометрической прогрессии.`,
          `${perenos(deystviya)} = x(${kSumTex(0, n - 1)})`,
        ),
        stFormula(
          'Делим на $k^' + n + '$ — получаем первоначальный вклад.',
          `S = \\dfrac{x(${kSumTex(0, n - 1)})}{k^{${n}}}`,
        ),
        stChisla(`$x = ${tex(x)}$.`, [
          `k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}, \\qquad k^{${n}} = ${tex(base)}, \\qquad ${kSumTex(0, n - 1)} = ${tex(kSum(k, 0, n - 1))}`,
          `S = \\dfrac{${tex(x)}\\cdot ${tex(kSum(k, 0, n - 1))}}{${tex(base)}} = ${tex(S)}`,
        ]),
        stAnswer(`${money(S, 'rub')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'С какой схемой совпадает эта задача?',
          'С аннуитетом: равные «платежи» гасят сумму до нуля',
          ['С дифференцированным платежом', 'Ни с какой'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-07: прирост за два года и за третий ────────────────────── */

const D07: Prototype = {
  id: 'D-07',
  type: 'D',
  subtype: 'Г1',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'По приросту вклада за два года и за третий найти первоначальный вклад',
  plot: DEP,
  forbid: [
    { a: 42, b: 24.2 },
    { a: 60, b: 49 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(['5', '10', '20', '25']));
    const k = kOf(r);
    const S = D(rng.int(10, 90) * 10);
    const a = S.mul(k.pow(2).sub(1));
    const b = S.mul(k.pow(2)).mul(k.sub(1));
    if (!isNice(a, 2) || !isNice(b, 2)) return null;
    let found: Drob = D(0);
    for (let rr = 1; rr <= 60; rr++) {
      const g = deposit(1, 3, rr);
      const ga = g[1]!.end.sub(1);
      const gb = g[2]!.end.sub(g[1]!.end);
      if (gb.div(ga).eq(b.div(a))) found = a.div(ga);
    }
    return {
      condition: `${plot.subject} ${v(plot, 'положил', 'положила')} в банк деньги ${plot.goal} под фиксированный процент годовых. За первые два года сумма вклада возросла на ${money(a, 'thous')}, а за третий год — ещё на ${money(b, 'thous')}. Какой была первоначальная сумма вклада? Ответ выразите в тысячах рублей.`,
      answer: S,
      verify: found,
      params: { a: a.toNumber(), b: b.toNumber() },
      rows: deposit(S, 3, r),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(
          '$S$ — первоначальный вклад, $k = 1 + \\dfrac{r}{100}$. За год вклад умножается на $k$.',
        ),
        step(
          'Два уравнения',
          'Прирост — разность вкладов.',
          `S(k^2 - 1) = ${tex(a)},\\qquad Sk^2(k - 1) = ${tex(b)}`,
        ),
        step(
          'Делим одно на другое',
          '$S$ сокращается; $k^2 - 1 = (k - 1)(k + 1)$.',
          `\\frac{k^2}{k + 1} = \\frac{${tex(b)}}{${tex(a)}} \\;\\Rightarrow\\; k = ${tex(k)}`,
        ),
        step(
          'Находим $S$',
          'Подставляем $k$ в первое уравнение.',
          `S = \\frac{${tex(a)}}{${tex(k.pow(2))} - 1} = ${tex(S)}`,
        ),
        stAnswer(`${money(S, 'thous')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Как избавиться от $S$?',
          'Разделить второе уравнение на первое',
          ['Сложить уравнения', 'Подставить $S = 100$'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-08: два вклада ─────────────────────────────────────────── */

const D08: Prototype = {
  id: 'D-08',
  type: 'D',
  subtype: 'Г6',
  source: 'fipi',
  difficulty: 'base',
  units: 'percent',
  title: 'Два вклада: наименьшая целая ставка, при которой второй выгоднее',
  plot: DEP,
  forbid: [{ rA: 10, r1: 8 }],
  make({ rng, plot }) {
    const rA = rng.int(6, 15);
    const r1 = rng.int(2, rA - 1);
    const kA3 = kOf(rA).pow(3);
    const better = (n: number) => kOf(r1).mul(kOf(n).pow(2)).gt(kA3);
    const n = smallestInt(better, 1, 60);
    const nV = smallestInt(
      (x) => last(deposit(1, 3, [r1, x, x])).gt(last(deposit(1, 3, rA))),
      1,
      60,
    );
    if (n === null || nV === null) return null;
    const ratio = kA3.div(kOf(r1));
    return {
      condition:
        `${plot.subject} ${v(plot, 'выбирает', 'выбирает')} вклад ${plot.goal} на три года. По вкладу «А» банк в конце каждого года увеличивает на ${pct(rA)} сумму, имеющуюся на вкладе в начале года, а по вкладу «Б» — увеличивает эту сумму на ${pct(r1)} в первый год и на одинаковое целое число $n$ процентов за второй и третий годы. ` +
        `Найдите наименьшее значение $n$, при котором за три года хранения вклад «Б» окажется выгоднее вклада «А» при одинаковых суммах первоначальных взносов.`,
      answer: D(n),
      verify: D(nV),
      params: { rA, r1 },
      rows: deposit(100, 3, [r1, n, n]),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(
          'Сравниваем, во сколько раз вырастет вклад; сумма взноса одна и та же, её можно взять за 100 %. Таблица — вклад «Б» при найденном $n$.',
        ),
        step('Вклад «А»', 'Три года по одной ставке.', `${tex(kOf(rA))}^3 = ${tex(kA3)}`),
        step(
          'Неравенство',
          'Вклад «Б» выгоднее, если его множитель больше.',
          `${tex(kOf(r1))}\\Big(1 + \\frac{n}{100}\\Big)^2 > ${tex(kA3)} \\;\\Rightarrow\\; \\Big(1 + \\frac{n}{100}\\Big)^2 > ${tex(D(Math.floor(ratio.toNumber() * 10000)).div(10000))}\\ldots`,
        ),
        step(
          'Перебираем целые',
          `При $n = ${n - 1}$ квадрат ещё не больше, при $n = ${n}$ — уже больше.`,
          `${tex(kOf(n - 1))}^2 = ${tex(kOf(n - 1).pow(2))},\\qquad ${tex(kOf(n))}^2 = ${tex(kOf(n).pow(2))}`,
        ),
        stAnswer(`$n = ${n}$.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Что сравниваем?',
          'Во сколько раз вырастет каждый вклад за три года',
          ['Сумму процентных ставок', 'Только ставки за первый год'],
          rng.int(0, 2),
          'Проценты нельзя складывать: множители перемножаются.',
        ),
      ],
    };
  },
};

/* ── D-09: снял и внёс ────────────────────────────────────────── */

const D09: Prototype = {
  id: 'D-09',
  type: 'D',
  subtype: 'Г5',
  source: 'own',
  sourceNote: 'Ларин',
  difficulty: 'hard',
  units: 'rub',
  title: 'Сняли и снова внесли ту же сумму: на сколько меньше итог',
  plot: DEP,
  forbid: [{ r: 10, x: 2000 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['5', '10', '20', '25']));
    const k = kOf(r);
    const x = D(rng.int(10, 200) * 100);
    const answer = x.mul(k).mul(k.sub(1));
    if (!answer.isInteger()) return null;
    const S = 100000;
    const verify = last(deposit(S, 3, r)).sub(last(deposit(S, 3, r, { after: [x.neg(), x, 0] })));
    return {
      condition:
        `${plot.subject} ${v(plot, 'положил', 'положила')} в банк деньги ${plot.goal} под ${pct(r)} годовых. Через год, после начисления процентов, со счёта сняли ${money(x, 'rub')}, а ещё через год (снова после начисления процентов) внесли ${money(x, 'rub')} обратно. ` +
        `Из-за этих действий через три года со времени открытия вклада сумма оказалась меньше запланированной (если бы промежуточных операций не было). На сколько рублей меньше запланированной суммы получилось?`,
      answer,
      verify,
      params: { r: r.toNumber(), x: x.toNumber() },
      rows: deposit(S, 3, r, { after: [x.neg(), x, 0] }),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(
          `Сумма вклада не дана — она и не нужна. Таблица для вклада ${money(S, 'rub')}; $k = ${tex(k)}$.`,
        ),
        step('Без операций', 'Через три года вклад вырос бы в $k^3$ раз.', 'Sk^3'),
        step(
          'С операциями',
          'Снятые деньги два года не приносили процентов, а внесённые — один год приносили.',
          `((Sk - x)k + x)k = Sk^3 - xk^2 + xk`,
        ),
        step(
          'Разность',
          'Вычитаем.',
          `xk^2 - xk = xk(k - 1) = ${tex(x)}\\cdot ${tex(k)}\\cdot ${tex(k.sub(1))} = ${tex(answer)}`,
        ),
        stAnswer(`На ${money(answer, 'rub')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Почему итог меньше?',
          'Снятые деньги дольше не приносили процентов, чем внесённые',
          ['Банк берёт плату за снятие', 'Итог не изменится'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-10: два банка и обмен долей (Ларин) ────────────────────── */

const D10: Prototype = {
  id: 'D-10',
  type: 'D',
  subtype: 'Г6',
  source: 'own',
  sourceNote: 'Ларин',
  difficulty: 'hard',
  units: 'rub',
  title: 'Доли суммы в двух банках и обмен долей',
  plot: DEP,
  forbid: [{ p: 5, q: 6, T1: 670, T2: 749, T1s: 710 }],
  make({ rng, plot }) {
    const [p, q] = rng.pick([
      [5, 6],
      [3, 4],
      [4, 5],
      [2, 3],
    ]) as [number, number];
    const f = D(p, q);
    const g = D(1).sub(f);
    const rates = rng.sample(['5', '10', '15', '20', '25'], 2);
    const kA = kOf(rates[0]!);
    const kB = kOf(rates[1]!);
    const S = D(rng.int(3, 30) * q * 1000);
    const T1 = f.mul(S).mul(kA).add(g.mul(S).mul(kB));
    const T2 = f
      .mul(S)
      .mul(kA.pow(2))
      .add(g.mul(S).mul(kB.pow(2)));
    const T1s = g.mul(S).mul(kA).add(f.mul(S).mul(kB));
    const answer = g
      .mul(S)
      .mul(kA.pow(2))
      .add(f.mul(S).mul(kB.pow(2)));
    if (![T1, T2, T1s, answer].every((x) => x.isInteger())) return null;
    // проверка: из T1 и T1s находим u = f·S·kA и w = g·S·kB, затем S из T2.
    const c1 = g.div(f);
    const c2 = f.div(g);
    // u + w = T1;  c1·u + c2·w = T1s
    const det = c2.sub(c1);
    if (det.eq(0)) return null;
    const u = T1.mul(c2).sub(T1s).div(det);
    const w = T1.sub(u);
    const Sv = u.mul(u).div(f).add(w.mul(w).div(g)).div(T2);
    const kAv = u.div(f.mul(Sv));
    const kBv = w.div(g.mul(Sv));
    const verify = g
      .mul(Sv)
      .mul(kAv.pow(2))
      .add(f.mul(Sv).mul(kBv.pow(2)));
    const fr = `$\\frac{${p}}{${q}}$`;
    return {
      condition:
        `В начале года ${fr} некоторой суммы денег ${plot.subject} ${v(plot, 'вложил', 'вложила')} в банк А, а то, что осталось, — в банк Б. Если вклад находится в банке с начала года, то к концу года он возрастает на определённый процент, величина которого зависит от банка. ` +
        `Известно, что к концу первого года сумма вкладов стала равна ${money(T1, 'rub')}, к концу следующего — ${money(T2, 'rub')}. Если бы первоначально ${fr} суммы было вложено в банк Б, а оставшуюся часть — в банк А, то по истечении одного года сумма выросла бы до ${money(T1s, 'rub')}. ` +
        `Какой была бы сумма вкладов по истечении второго года в этом случае? Ответ дайте в рублях.`,
      answer,
      verify,
      params: { p, q, T1: T1.toNumber(), T2: T2.toNumber(), T1s: T1s.toNumber() },
      rows: deposit(f.mul(S), 2, rates[0]!),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(
          `Таблица — часть вклада в банке А. Обозначим $S$ — сумму, $a$ и $b$ — коэффициенты банков А и Б. Удобно ввести $u = ${p === 5 ? '\\frac56' : `\\frac{${p}}{${q}}`}Sa$ и $w = \\frac{${q - p}}{${q}}Sb$ — сколько стало в каждом банке за первый год.`,
        ),
        step(
          'Первый год',
          'Два уравнения: как есть и при обмене долей.',
          `u + w = ${tex(T1)},\\qquad \\frac{${q - p}}{${p}}\\,u + \\frac{${p}}{${q - p}}\\,w = ${tex(T1s)}`,
        ),
        step(
          'Находим $u$ и $w$',
          'Решаем систему линейных уравнений.',
          `u = ${tex(u)},\\quad w = ${tex(w)}`,
        ),
        step(
          'Второй год',
          'Каждая часть ещё раз умножилась на свой коэффициент: $ua + wb = ' +
            tex(T2) +
            '$. Отсюда находим $S$, затем $a$ и $b$.',
          `S = ${tex(Sv)},\\quad a = ${tex(kAv)},\\quad b = ${tex(kBv)}`,
        ),
        step(
          'Сумма при обмене через два года',
          `В банк Б вложено ${fr} суммы, в банк А — остальное.`,
          `\\frac{${q - p}}{${q}}\\cdot ${tex(Sv)}\\cdot ${tex(kAv)}^2 + \\frac{${p}}{${q}}\\cdot ${tex(Sv)}\\cdot ${tex(kBv)}^2 = ${tex(answer)}`,
        ),
        stAnswer(`${money(answer, 'rub')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          'Какие неизвестные удобно ввести?',
          'Сколько стало в каждом банке за первый год',
          ['Только процентные ставки', 'Только сумму вклада'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-11: фиксированные пополнения, рост на P % ──────────────── */

const D11: Prototype = {
  id: 'D-11',
  type: 'D',
  subtype: 'Г7',
  source: 'own',
  sourceNote: 'Ларин',
  difficulty: 'hard',
  units: 'thous',
  title: 'Фиксированное ежегодное пополнение по росту вклада за пять лет',
  plot: DEP,
  maxDecimals: 2,
  forbid: [{ S: 3900, r: 50, P: 725 }],
  make({ rng, plot }) {
    const r = D(rng.pick(['10', '20', '25', '50']));
    const k = kOf(r);
    const S = D(rng.int(10, 60) * 100);
    const x = D(rng.int(5, 100) * 10);
    const fin = S.mul(k.pow(5)).add(x.mul(kSum(k, 1, 4)));
    const P = fin.div(S).sub(1).mul(100);
    if (!isNice(P, 2)) return null;
    const after = (val: Drob) => [val, val, val, val, D(0)];
    const e0 = last(deposit(S, 5, r, { after: after(D(0)) }));
    const e1 = last(deposit(S, 5, r, { after: after(D(1)) }));
    const target = S.mul(D(100).add(P)).div(100);
    const verify = target.sub(e0).div(e1.sub(e0));
    return {
      condition:
        `${plot.subject} ${v(plot, 'положил', 'положила')} ${money(S, 'thous')} ${plot.goal} в банк под ${pct(r)} годовых. В конце каждого из первых четырёх лет хранения после начисления процентов на счёт дополнительно вносили одну и ту же фиксированную сумму. ` +
        `К концу пятого года после начисления процентов оказалось, что размер вклада увеличился по сравнению с первоначальным на ${pct(P)}. Какую сумму ежегодно добавляли к вкладу? Ответ выразите в тысячах рублей.`,
      answer: x,
      verify,
      params: { S: S.toNumber(), r: r.toNumber(), P: P.toNumber() },
      rows: deposit(S, 5, r, { after: after(x) }),
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(`Считаем в тысячах рублей, $k = ${tex(k)}$, $x$ — ежегодное пополнение.`),
        step(
          'Итог через пять лет',
          `«Увеличился на ${num(P)} %» — стал ${num(D(100).add(P))} % от первоначального.`,
          `Sk^5 + x(k^4 + k^3 + k^2 + k) = ${tex(D(100).add(P).div(100))}\\,S`,
        ),
        step(
          'Подставляем числа',
          'Считаем степени $k$ заранее.',
          `${tex(S.mul(k.pow(5)))} + ${tex(kSum(k, 1, 4))}\\,x = ${tex(target)}`,
        ),
        step(
          'Находим $x$',
          'Решаем линейное уравнение.',
          `x = \\frac{${tex(target.sub(S.mul(k.pow(5))))}}{${tex(kSum(k, 1, 4))}} = ${tex(x)}`,
        ),
        stAnswer(`${money(x, 'thous')}.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          `Что значит «увеличился на ${num(P)} %»?`,
          `Стал $${tex(D(100).add(P).div(100))}\\,S$`,
          [`Стал $${tex(P.div(100))}\\,S$`, `Стал $S + ${tex(P)}$`],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

/* ── D-12: процентные пункты ──────────────────────────────────── */

const D12: Prototype = {
  id: 'D-12',
  type: 'D',
  subtype: 'Г8',
  source: 'own',
  sourceNote: 'Ларин',
  difficulty: 'hard',
  units: 'percent',
  title: 'Ставка выросла на $d$ процентных пунктов — найти новую ставку',
  plot: DEP,
  maxDecimals: 2,
  forbid: [{ f: 4, d: 40, q: 1.44 }],
  make({ rng, plot }) {
    const a = rng.pick([10, 20, 25, 30, 40, 50, 60]);
    const d = rng.pick([10, 20, 30, 40]);
    const fd = rng.pick([2, 3, 4, 5]);
    const keep = D(fd - 1, fd);
    const qv = kOf(a)
      .mul(keep)
      .mul(kOf(a + d));
    if (!isNice(qv, 3) || qv.lt('1.05')) return null;
    let found: Drob = D(0);
    for (let x = 1; x <= 200; x++) {
      const y1 = deposit(1, 1, x)[0]!.end;
      const y2 = deposit(y1.mul(keep), 1, x + d)[0]!.end;
      if (y2.eq(qv)) found = D(x + d);
    }
    const frac = fd === 2 ? 'половина' : fd === 3 ? 'треть' : fd === 4 ? 'четверть' : 'пятая часть';
    const fracAcc =
      fd === 2 ? 'половину' : fd === 3 ? 'треть' : fd === 4 ? 'четверть' : 'пятую часть';
    const rows = deposit(100, 2, [a, a + d], { after: [kOf(a).mul(100).mul(D(1, fd)).neg(), 0] });
    const c = qv.div(keep);
    const dd = D(d, 100);
    const koren = kOf(a).mul(2).add(dd);
    const tablitsaD12: TablitsaPeremennye = {
      podpis: '',
      period: 'year',
      scheme: 'dep',
      rows: [
        {
          label: '1',
          cells: [
            'S',
            'Sk_{1}',
            `-\\dfrac{1}{${fd}}\\,Sk_{1}`,
            `V_{1} = \\dfrac{${fd - 1}}{${fd}}\\,Sk_{1}`,
          ],
        },
        { label: '2', cells: ['V_{1}', 'V_{1}\\,k_{2}', '0', 'V_{2} = V_{1}\\,k_{2}'] },
      ],
      itog: null,
      strelka: null,
    };
    return {
      condition:
        `${plot.subject} ${v(plot, 'положил', 'положила')} в банк деньги ${plot.goal} под определённый процент. Через год ${frac} накопленной суммы была снята со счёта. Банк увеличил процент годовых на ${d} процентных пунктов (то есть увеличил ставку $a$ % до $(a + ${d})$ %). ` +
        `К концу следующего года накопленная сумма в ${num(qv)} раза превысила первоначальный вклад. Каков процент новых годовых?`,
      answer: D(a + d),
      verify: found,
      params: { f: fd, d, q: qv.toNumber() },
      rows,
      scheme: 'dep',
      period: 'year',
      solution: [
        stTablitsaBukvy(
          `Первый год ставка $a\\,\\%$, множитель $k_{1} = 1 + \\dfrac{a}{100}$. Ставку увеличили на $d$ процентных пунктов: во второй год ставка $(a + d)\\,\\%$, множитель $k_{2} = 1 + \\dfrac{a + d}{100} = k_{1} + \\dfrac{d}{100}$. Через год снимают ${fracAcc} накопленной суммы.`,
          tablitsaD12,
        ),
        {
          title: 'Составляем уравнение',
          text: `Вклад на конец года — вклад на начало следующего. Через два года сумма в $q$ раз больше первоначальной: $V_{2} = qS$.`,
          bloki: [
            {
              vid: 'formula',
              tex: `V_{1} = Sk_{1} - \\dfrac{1}{${fd}}\\,Sk_{1} = \\dfrac{${fd - 1}}{${fd}}\\,Sk_{1}`,
            },
            {
              vid: 'formula',
              tex: `V_{2} = V_{1}\\,k_{2} = \\dfrac{${fd - 1}}{${fd}}\\,Sk_{1}k_{2}`,
            },
            { vid: 'formula', tex: `\\dfrac{${fd - 1}}{${fd}}\\,Sk_{1}k_{2} = qS` },
          ],
        },
        step(
          'Делим на $S$ и подставляем $k_{2}$',
          'Первоначальный вклад сокращается — остаётся уравнение на $k_{1}$.',
          `k_{1}\\Big(k_{1} + \\dfrac{d}{100}\\Big) = \\dfrac{${fd}q}{${fd - 1}} \\;\\Rightarrow\\; k_{1}^2 + \\dfrac{d}{100}\\,k_{1} - \\dfrac{${fd}q}{${fd - 1}} = 0`,
        ),
        step(
          'Решаем квадратное уравнение относительно $k_{1}$',
          'Множитель положительный — берём корень со знаком «плюс».',
          `k_{1} = \\dfrac{1}{2}\\left(-\\dfrac{d}{100} + \\sqrt{\\Big(\\dfrac{d}{100}\\Big)^2 + \\dfrac{4\\cdot ${fd}q}{${fd - 1}}}\\right)`,
        ),
        stFormula(
          'Новая ставка — старая плюс $d$ пунктов.',
          'a = 100\\,(k_{1} - 1), \\qquad a + d = 100\\,(k_{1} - 1) + d',
        ),
        stChisla(`$d = ${d}$, $q = ${tex(qv)}$.`, [
          `\\dfrac{${fd}q}{${fd - 1}} = ${tex(c)}, \\qquad \\dfrac{d}{100} = ${tex(dd)}`,
          `k_{1} = \\dfrac{1}{2}\\big(-${tex(dd)} + \\sqrt{${tex(dd.mul(dd))} + ${tex(c.mul(4))}}\\big) = \\dfrac{-${tex(dd)} + ${tex(koren)}}{2} = ${tex(kOf(a))}`,
          `a = 100\\,(${tex(kOf(a))} - 1) = ${a}, \\qquad a + d = ${a} + ${d} = ${a + d}`,
        ]),
        {
          title: 'Внимание на формулировку',
          text: `«На ${d} процентных пунктов» — к ставке прибавляют ${d}. Это не то же, что «на ${d} %»: тогда ставку умножили бы на $${tex(kOf(d))}$. Например, ${a} % + ${d} п. п. = ${a + d} %, а ${a} % + ${d} % = ${num(D(a).mul(kOf(d)))} %.`,
          vid: 'vnimanie',
        },
        stAnswer(`Новый процент годовых — ${a + d} %.`),
      ],
      hints: [
        hintType('D', rng.int(0, 2)),
        choice(
          `Ставка была 20 %. Какой она станет после увеличения на ${d} процентных пунктов?`,
          `${20 + d} %`,
          [`${num(D(20).mul(kOf(d)))} %`, `${d} %`],
          rng.int(0, 2),
          'Процентные пункты прибавляются к ставке.',
        ),
      ],
    };
  },
};

/* ── D-13: хватит ли на цель ──────────────────────────────────── */

const D13: Prototype = {
  id: 'D-13',
  type: 'D',
  subtype: 'Г9',
  source: 'own',
  sourceNote: 'по А. Малковой',
  difficulty: 'base',
  units: 'rub',
  title: 'Сколько будет на счёте через четыре года с пополнениями',
  plot: DEP,
  forbid: [{ S1: 1000000, x: 600000, r: 10 }],
  make({ rng, plot }) {
    const S1 = D(rng.int(5, 30) * 100000);
    const x = D(rng.int(1, 10) * 100000);
    const r = D(rng.pick(['5', '10', '20']));
    const k = kOf(r);
    const answer = S1.mul(k.pow(4)).add(x.mul(kSum(k, 1, 3)));
    if (!answer.isInteger()) return null;
    const rows = deposit(S1, 4, r, { after: [x, x, x, 0] });
    return {
      condition:
        `${plot.subject} ${v(plot, 'копит', 'копит')} ${plot.goal}. Сейчас у ${plot.g === 'f' ? 'неё' : 'него'} ${money(S1, 'rub')}, и всю эту сумму ${plot.g === 'f' ? 'она' : 'он'} кладёт в банк под ${pct(r)} годовых. ` +
        `В течение каждого из первых трёх лет после начисления банком процентов ${plot.g === 'f' ? 'она' : 'он'} вносит на счёт ещё по ${money(x, 'rub')}. Какая сумма будет на счёте через четыре года после начисления процентов? Ответ дайте в рублях.`,
      answer,
      verify: last(rows),
      params: { S1: S1.toNumber(), x: x.toNumber(), r: r.toNumber() },
      rows,
      scheme: 'dep',
      period: 'year',
      solution: [
        stTable(
          `Каждый год вклад умножается на $k = ${tex(k)}$, первые три года после начисления добавляем ${money(x, 'rub')}.`,
        ),
        step(
          'Записываем цепочку',
          'Раскрываем скобки.',
          `(((S k + x)k + x)k + x)k = Sk^4 + x(k^3 + k^2 + k)`,
        ),
        step(
          'Считаем',
          'Подставляем числа.',
          `${tex(S1)}\\cdot ${tex(k.pow(4))} + ${tex(x)}\\cdot ${tex(kSum(k, 1, 3))} = ${tex(answer)}`,
        ),
        stAnswer(`${money(answer, 'rub')}.`),
      ],
      hints: [hintType('D', rng.int(0, 2)), hintK(rng.int(0, 2))],
    };
  },
};

void sum;
void plural;
void years;

export const PROTO_D: Prototype[] = [
  makeTopUp('D-01'),
  makeTopUp('D-02'),
  D03,
  D04,
  D05,
  D06,
  D07,
  D08,
  D09,
  D10,
  D11,
  D12,
  D13,
];
