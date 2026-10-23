/**
 * Прототипы задания №13: дифференцированный платёж (A-01 … A-19).
 * Список и источники — docs/13-economics/03-prototypes.md.
 *
 * Таблица — формат «Долг на начало · Сумма изменения долга · Переплата ·
 * Долг на конец». Формула переплаты выводится через арифметическую
 * прогрессию, готовой не даётся (конвенция автора).
 */

import { D, type Drob, sum } from '../drob';
import { v } from '../plots';
import { byDebts, differentiated, overpay, totalPaid } from '../solver';
import {
  DIF_RULE,
  frame15,
  frameEnd,
  frameJuly,
  money,
  months,
  num,
  pct,
  plural,
  years,
  MONTHS_GEN,
} from '../text';
import {
  choice,
  hintChangeSum,
  hintOverpayFormula,
  hintType,
  isNice,
  largestInt,
  step,
  tex,
} from './common';
import type { Prototype } from './types';

/* ── Общие шаги ───────────────────────────────────────────────── */

const stTable = (text: string) => step('Составляем таблицу', text, undefined, true);

/** Вывод переплаты через сумму долгов на начало — арифметическая прогрессия. */
const stDerive = (period: 'month' | 'year' = 'month') =>
  step(
    'Складываем переплаты',
    `Переплата за ${period === 'month' ? 'месяц' : 'год'} — $r$ % от долга на начало. Долги на начало убывают равномерно, это арифметическая прогрессия, её сумма — полусумма первого и последнего, умноженная на число членов.`,
    'S_{\\text{перепл}} = \\frac{r}{100}\\Big(S + \\frac{(n-1)S}{n} + \\dots + \\frac{S}{n}\\Big) = \\frac{r}{100}\\cdot\\frac{S + \\frac{S}{n}}{2}\\cdot n = S\\cdot\\frac{n+1}{2}\\cdot\\frac{r}{100}',
  );

const stTotal = () =>
  step(
    'Общая сумма выплат',
    'Вернуть банку нужно всё, что взяли, и переплату.',
    'S_{\\text{общ}} = S + S_{\\text{перепл}} = S\\Big(1 + \\frac{n+1}{2}\\cdot\\frac{r}{100}\\Big)',
  );

const stAnswer = (text: string) => step('Ответ', text);

const hintsA = (shift: number, last: ReturnType<typeof choice>[] = []) => [
  hintType('A', shift),
  hintChangeSum(shift + 1),
  hintOverpayFormula(shift + 2),
  ...last,
];

/** Переплата в процентах от кредита: (n+1)/2 · r. */
const overpayPct = (n: number, r: Drob): Drob =>
  D(n + 1)
    .div(2)
    .mul(r);

const R_MONTH = ['1', '1.5', '2', '2.5', '3', '4', '5'];

/* ── Прототипы ────────────────────────────────────────────────── */

const A01: Prototype = {
  id: 'A-01',
  type: 'A',
  subtype: 'А1',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'Переплата при известных сумме, сроке и ставке',
  forbid: [
    { S: 50000, n: 3, r: 10 },
    { S: 60000, n: 4, r: 10 },
  ],
  make({ rng, plot }) {
    const n = rng.int(3, 6);
    const r = D(rng.pick([2, 3, 4, 5, 6, 8, 10, 12]));
    const S = D(rng.int(3, 30) * 10000);
    const answer = S.mul(n + 1)
      .div(2)
      .mul(r)
      .div(100);
    if (!answer.isInteger() || !isNice(S.div(n), 2)) return null;
    const rows = differentiated(S, n, r);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} в размере ${money(S, 'rub')} на ${months(n)}. ${DIF_RULE} ` +
        `${frameEnd(plot, 'month', r)} Сколько рублей составит переплата по кредиту?`,
      answer,
      verify: overpay(rows),
      params: { S: S.toNumber(), n, r: r.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable(
          `Каждый месяц долг уменьшается на $\\dfrac{S}{n} = ${tex(S.div(n))}$ рублей. Переплата за месяц — ${num(r)} % от долга на начало месяца.`,
        ),
        stDerive(),
        step(
          'Считаем',
          'Подставляем числа и сокращаем.',
          `S_{\\text{перепл}} = ${tex(S)}\\cdot\\frac{${n + 1}}{2}\\cdot\\frac{${tex(r)}}{100} = ${tex(answer)}`,
        ),
        stAnswer(`Переплата составит ${money(answer, 'rub')}.`),
      ],
      hints: hintsA(rng.int(0, 2)),
    };
  },
};

const A02: Prototype = {
  id: 'A-02',
  type: 'A',
  subtype: 'А8',
  source: 'own',
  sourceNote: 'авторская (лист «Дифференцируемый платёж»)',
  difficulty: 'base',
  units: 'percent',
  title: 'Два банка: где переплата меньше и на сколько процентов',
  forbid: [
    { n1: 15, r1: 6, n2: 6, r2: 14 },
    { n1: 20, r1: 5, n2: 8, r2: 12 },
  ],
  make({ rng, plot }) {
    const n1 = rng.int(10, 20);
    const r1 = D(rng.int(4, 9));
    const n2 = rng.int(4, n1 - 4);
    const r2 = D(rng.int(r1.toNumber() + 3, 18));
    const p1 = overpayPct(n1, r1);
    const p2 = overpayPct(n2, r2);
    const answer = p1.sub(p2).cmp(0) > 0 ? p1.sub(p2) : p2.sub(p1);
    if (answer.eq(0) || answer.gt(12) || !isNice(answer, 1)) return null;
    const better = p1.lt(p2) ? 'первый' : 'второй';
    const verify = (() => {
      const a = overpay(differentiated(1, n1, r1)).mul(100);
      const b = overpay(differentiated(1, n2, r2)).mul(100);
      return a.gt(b) ? a.sub(b) : b.sub(a);
    })();
    return {
      condition:
        `${plot.subject} выбирает банк для кредита ${plot.goal}. Первый банк предлагает кредит на ${years(n1)} под ${pct(r1)} годовых, второй — на ${years(n2)} под ${pct(r2)} годовых. ` +
        `В обоих банках платежи дифференцированные: долг каждый год уменьшается на одну и ту же величину, проценты начисляются раз в год на остаток долга. ` +
        `На сколько процентов от суммы кредита переплата в более выгодном банке меньше, чем в другом?`,
      answer,
      verify,
      params: { n1, r1: r1.toNumber(), n2, r2: r2.toNumber() },
      rows: differentiated(100, n2, r2),
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          'Сумма кредита одна и та же, поэтому сравниваем переплату в процентах от кредита. Таблица для второго банка — при кредите 100 %.',
        ),
        stDerive('year'),
        step(
          'Первый банк',
          'Переплата в процентах от кредита.',
          `\\frac{${n1}+1}{2}\\cdot ${tex(r1)}\\,\\% = ${tex(p1)}\\,\\%`,
        ),
        step(
          'Второй банк',
          'Так же для второго банка.',
          `\\frac{${n2}+1}{2}\\cdot ${tex(r2)}\\,\\% = ${tex(p2)}\\,\\%`,
        ),
        stAnswer(
          `Выгоднее ${better} банк, переплата меньше на ${tex(answer).replace('{,}', ',')} % от суммы кредита.`,
        ),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'С чем сравниваем переплату?',
          'С суммой кредита: она в обоих банках одна',
          ['С годовой ставкой', 'Со сроком кредита'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A03: Prototype = {
  id: 'A-03',
  type: 'A',
  subtype: 'А5',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'По платежу m-го месяца найти общую сумму выплат',
  forbid: [
    { n: 31, r: 3, m: 16 },
    { n: 21, r: 4, m: 11 },
  ],
  make({ rng, plot }) {
    const n = rng.int(12, 36);
    const r = D(rng.pick(['1', '2', '3', '4', '5']));
    const m = rng.int(2, n - 1);
    const q = D(rng.int(5, 80)); // S / n, тыс.
    const S = q.mul(n);
    const z = q.mul(D(1).add(r.mul(n - m + 1).div(100)));
    if (!isNice(z, 1)) return null;
    const answer = S.mul(
      D(1).add(
        D(n + 1)
          .mul(r)
          .div(200),
      ),
    );
    if (!isNice(answer, 1)) return null;
    const rows = differentiated(S, n, r);
    const zSolver = rows[m - 1]!.payment;
    const Ssolver = z.div(zSolver.div(S));
    return {
      condition: `${frame15(plot, rng.int(0, 11), n, r)}\nИзвестно, что в ${m}-й месяц кредитования нужно сделать платёж в размере ${money(z, 'thous')}. Какую сумму нужно вернуть банку в течение всего срока кредитования? Ответ выразите в тысячах рублей.`,
      answer,
      verify: totalPaid(differentiated(Ssolver, n, r)),
      params: { n, r: r.toNumber(), m, z: z.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [m],
      solution: [
        stTable(
          `Пусть $S$ — сумма кредита. Сумма изменения долга каждый месяц $\\dfrac{S}{${n}}$. В начале ${m}-го месяца долг равен $\\dfrac{${n - m + 1}S}{${n}}$.`,
        ),
        step(
          `Платёж ${m}-го месяца`,
          'Платёж — это сумма изменения долга плюс переплата за месяц.',
          `\\frac{S}{${n}} + \\frac{${tex(r)}}{100}\\cdot\\frac{${n - m + 1}S}{${n}} = ${tex(z)} \\;\\Rightarrow\\; \\frac{S}{${n}} = ${tex(q)},\\; S = ${tex(S)}`,
        ),
        stDerive(),
        stTotal(),
        step(
          'Считаем',
          'Подставляем найденную сумму кредита.',
          `S_{\\text{общ}} = ${tex(S)}\\Big(1 + \\frac{${n + 1}}{2}\\cdot\\frac{${tex(r)}}{100}\\Big) = ${tex(answer)}`,
        ),
        stAnswer(`Вернуть нужно ${money(answer, 'thous')}.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          `Из чего складывается платёж ${m}-го месяца?`,
          'Сумма изменения долга плюс переплата за этот месяц',
          ['Только переплата за месяц', 'Сумма кредита, делённая на номер месяца'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A04: Prototype = {
  id: 'A-04',
  type: 'A',
  subtype: 'А3',
  source: 'fipi',
  difficulty: 'base',
  units: 'percent',
  title: 'По переплате в процентах найти месячную ставку',
  forbid: [
    { n: 6, p: 63 },
    { n: 8, p: 45 },
  ],
  make({ rng, plot }) {
    const n = rng.int(4, 24);
    const r = D(rng.pick(['1', '1.5', '2', '2.5', '3', '4', '5', '6', '8', '10', '12']));
    const p = overpayPct(n, r);
    if (!isNice(p, 1) || p.gt(80)) return null;
    const rows = differentiated(100, n, r);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} на ${months(n)}. В конце каждого месяца общая сумма оставшегося долга увеличивается на одно и то же число процентов (месячную процентную ставку), а затем уменьшается на сумму платежа. ` +
        `Платежи подбираются так, чтобы сумма долга каждый месяц уменьшалась равномерно, то есть на одну и ту же величину. Общая сумма выплат превысила сумму кредита на ${pct(p)}. Найдите месячную процентную ставку.`,
      answer: r,
      verify: D(p).div(overpay(differentiated(1, n, 1)).mul(100)),
      params: { n, p: p.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable(
          'Сумма кредита неизвестна и не нужна: примем её за 100 % и будем считать всё в процентах от кредита.',
        ),
        stDerive(),
        step(
          'Составляем уравнение',
          `Переплата — это ${num(p)} % от $S$.`,
          `S\\cdot\\frac{${n}+1}{2}\\cdot\\frac{r}{100} = \\frac{${tex(p)}}{100}\\,S \\;\\Rightarrow\\; \\frac{${n + 1}}{2}\\,r = ${tex(p)}`,
        ),
        step(
          'Находим ставку',
          'Делим обе части на коэффициент при $r$.',
          `r = \\frac{${tex(p)}\\cdot 2}{${n + 1}} = ${tex(r)}`,
        ),
        stAnswer(`Месячная ставка — ${pct(r)}.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'Какое уравнение получается?',
          `$\\dfrac{${n + 1}}{2}\\cdot r = ${tex(p)}$`,
          [`$\\dfrac{${n}}{2}\\cdot r = ${tex(p)}$`, `$${n}\\cdot r = ${tex(p)}$`],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A05: Prototype = {
  id: 'A-05',
  type: 'A',
  subtype: 'А2',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2017',
  difficulty: 'base',
  units: 'months',
  title: 'По переплате в процентах найти срок',
  forbid: [
    { r: 3, p: 30 },
    { r: 2, p: 25 },
    { r: 5, p: 25 },
    { r: 4, p: 26 },
  ],
  make({ rng, plot }) {
    const r = D(rng.pick(R_MONTH));
    const n = rng.int(6, 36);
    const p = overpayPct(n, r);
    if (!isNice(p, 1) || p.gt(60)) return null;
    const rows = differentiated(100, n, r);
    let found = 0;
    for (let k = 1; k <= 120; k++) if (overpay(differentiated(100, k, r)).eq(p)) found = k;
    return {
      condition: `${frame15(plot, rng.int(0, 11), null, r)}\nНа сколько месяцев взят кредит, если известно, что общая сумма выплат после полного погашения кредита на ${pct(p)} больше суммы, взятой в кредит?`,
      answer: D(n),
      verify: D(found),
      params: { r: r.toNumber(), p: p.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable(
          'Срок обозначим $n$. Сумма изменения долга каждый месяц $\\dfrac{S}{n}$, переплата за месяц — от долга на начало.',
        ),
        stDerive(),
        step(
          'Составляем уравнение',
          `Переплата — это ${num(p)} % от $S$; «на ${num(p)} % больше суммы кредита» — 100 % здесь сумма кредита.`,
          `S\\cdot\\frac{n+1}{2}\\cdot\\frac{${tex(r)}}{100} = \\frac{${tex(p)}}{100}\\,S`,
        ),
        step(
          'Находим срок',
          'Сокращаем на $S$ и на сотню.',
          `n + 1 = \\frac{2\\cdot ${tex(p)}}{${tex(r)}} = ${n + 1} \\;\\Rightarrow\\; n = ${n}`,
        ),
        stAnswer(`Кредит взят на ${months(n)}.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'Что принимаем за 100 %?',
          'Сумму кредита $S$',
          ['Общую сумму выплат', 'Переплату'],
          rng.int(0, 2),
          'После «чем» стоит сумма кредита — её и принимаем за 100 %.',
        ),
      ]),
    };
  },
};

const A06: Prototype = {
  id: 'A-06',
  type: 'A',
  subtype: 'А5',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'По выплатам за первую половину срока найти выплаты за вторую',
  forbid: [
    { n: 24, r: 2, Z1: 2466 },
    { n: 20, r: 2, Z1: 1310 },
  ],
  make({ rng, plot }) {
    const n = rng.pick([12, 16, 20, 24, 30]);
    const m = n / 2;
    const r = D(rng.pick(['1', '2', '3', '4']));
    const q = D(rng.int(10, 120)); // S/n, тыс.
    const S = q.mul(n);
    const rows = differentiated(S, n, r);
    const z1 = sum(rows.slice(0, m).map((x) => x.payment));
    const z2 = sum(rows.slice(m).map((x) => x.payment));
    // формула: первая половина = m·q + r/100·q·(n + … + (n−m+1)), вторая = m·q + r/100·q·(m + … + 1)
    const fFirst = q.mul(m).add(
      r
        .div(100)
        .mul(q)
        .mul((n + n - m + 1) * m)
        .div(2),
    );
    const fSecond = q.mul(m).add(
      r
        .div(100)
        .mul(q)
        .mul((m + 1) * m)
        .div(2),
    );
    if (!isNice(fFirst, 1) || !isNice(fSecond, 1)) return null;
    const unitRow = differentiated(1, n, r);
    const Sfound = fFirst.div(sum(unitRow.slice(0, m).map((x) => x.payment)));
    return {
      condition: `${frame15(plot, rng.int(0, 11), n, r)}\nИзвестно, что за первые ${months(m)} кредитования нужно вернуть банку ${money(fFirst, 'thous')}. Какую сумму нужно выплатить банку за последние ${months(m)}? Ответ выразите в тысячах рублей.`,
      answer: fSecond,
      verify: sum(
        differentiated(Sfound, n, r)
          .slice(m)
          .map((x) => x.payment),
      ),
      params: { n, r: r.toNumber(), Z1: fFirst.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [m, m + 1],
      solution: [
        stTable(
          `Обозначим $x = \\dfrac{S}{${n}}$ — сумму изменения долга. Долги на начало месяцев: $${n}x, ${n - 1}x, \\dots, x$.`,
        ),
        step(
          `Первые ${m} месяцев`,
          'Сумма изменений долга за эти месяцы плюс переплаты; долги на начало — арифметическая прогрессия.',
          `${m}x + \\frac{${tex(r)}}{100}\\,x\\,(${n} + ${n - 1} + \\dots + ${n - m + 1}) = ${m}x + \\frac{${tex(r)}}{100}\\cdot ${((n + n - m + 1) * m) / 2}\\,x = ${tex(fFirst)}`,
        ),
        step('Находим $x$', 'Решаем линейное уравнение.', `x = ${tex(q)}`),
        step(
          `Последние ${m} месяцев`,
          'Так же, только долги на начало — от $' + m + 'x$ до $x$.',
          `${m}x + \\frac{${tex(r)}}{100}\\,x\\,(${m} + \\dots + 1) = ${m}\\cdot ${tex(q)} + \\frac{${tex(r)}}{100}\\cdot ${((m + 1) * m) / 2}\\cdot ${tex(q)} = ${tex(fSecond)}`,
        ),
        stAnswer(`За последние ${months(m)} нужно выплатить ${money(fSecond, 'thous')}.`),
      ],
      hints: hintsA(rng.int(0, 2)),
      problems: z1.eq(fFirst) && z2.eq(fSecond) ? [] : ['формула половин не сошлась с таблицей'],
    };
  },
};

const A07: Prototype = {
  id: 'A-07',
  type: 'A',
  subtype: 'А9',
  source: 'own',
  sourceNote: 'авторская (лист «Дифференцируемый платёж», по сборнику)',
  difficulty: 'hard',
  units: 'percent',
  title: 'Наибольший платёж в q раз меньше кредита — найти ставку',
  forbid: [
    { n: 50, q: 20 },
    { n: 40, q: 25 },
  ],
  make({ rng, plot }) {
    const n = rng.pick([12, 15, 18, 20, 24, 25, 30, 36, 40, 48, 50, 60]);
    const q = rng.int(Math.ceil(n / 3), n - 1);
    // z1 = S/n·(1 + pn/100) = S/q ⇒ p = (n/q − 1)·100/n
    const p = D(n).div(q).sub(1).mul(100).div(n);
    if (!isNice(p, 2) || p.lt('0.5') || p.gt(5)) return null;
    const rows = differentiated(100, n, p);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} на ${months(n)}, который нужно вернуть ежемесячными платежами. В конце каждого месяца банк начисляет $p$ % на сумму задолженности, а размер ежемесячных платежей подбирается так, чтобы сумма основного долга уменьшалась равномерно. ` +
        `Известно, что наибольший платёж был в ${q} раз меньше первоначальной суммы долга. Найдите $p$.`,
      answer: p,
      verify: rows[0]!.payment.div(100).eq(D(1).div(q)) ? p : D(0),
      params: { n, q },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable(
          'Наибольший платёж — первый: в первый месяц долг самый большой, значит, и переплата самая большая.',
        ),
        step(
          'Первый платёж',
          'Сумма изменения долга плюс переплата за первый месяц.',
          `\\frac{S}{${n}} + \\frac{p}{100}\\,S = \\frac{S}{${q}}`,
        ),
        step(
          'Находим $p$',
          'Сокращаем на $S$.',
          `\\frac{p}{100} = \\frac{1}{${q}} - \\frac{1}{${n}} = \\frac{${n - q}}{${n * q}} \\;\\Rightarrow\\; p = ${tex(p)}`,
        ),
        stAnswer(`$p = ${tex(p)}$.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'Какой платёж наибольший?',
          'Первый',
          ['Последний', 'Все платежи равны'],
          rng.int(0, 2),
          'Долг на начало самый большой в первый месяц.',
        ),
      ]),
    };
  },
};

const A08: Prototype = {
  id: 'A-08',
  type: 'A',
  subtype: 'А1',
  source: 'fipi',
  difficulty: 'base',
  units: 'percent',
  title: 'На сколько процентов больше кредита придётся заплатить',
  forbid: [
    { n: 18, r: 2 },
    { n: 15, r: 3 },
  ],
  make({ rng, plot }) {
    const n = rng.int(6, 36);
    const r = D(rng.pick(R_MONTH));
    const p = overpayPct(n, r);
    if (!isNice(p, 1) || p.gt(70)) return null;
    const rows = differentiated(100, n, r);
    return {
      condition: `${frame15(plot, rng.int(0, 11), n, r)}\nНа сколько процентов больше по отношению к сумме кредита придётся заплатить банку?`,
      answer: p,
      verify: overpay(rows),
      params: { n, r: r.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable('Примем сумму кредита за 100 %: тогда переплата сразу получится в процентах.'),
        stDerive(),
        step(
          'Считаем',
          'Подставляем срок и ставку.',
          `\\frac{${n}+1}{2}\\cdot ${tex(r)}\\,\\% = ${tex(p)}\\,\\%`,
        ),
        stAnswer(`На ${pct(p)} больше.`),
      ],
      hints: hintsA(rng.int(0, 2)),
    };
  },
};

/** Полугодовой кредит с графиком долга: подписи дат и таблица условия. */
function scheduleTable(startMonth: number, shares: Drob[], unit: 'pct' | 'mln') {
  const dates = shares.map((_, i) => `15.${String(((startMonth + i) % 12) + 1).padStart(2, '0')}`);
  const cells = shares.map((x) => (unit === 'pct' ? `${num(x)} %` : num(x)));
  return {
    head: ['Дата', ...dates],
    rows: [[unit === 'pct' ? 'Долг (в процентах от кредита)' : 'Долг (в млн рублей)', ...cells]],
    dates,
  };
}

function makeSchedule(id: string, equal: boolean): Prototype {
  return {
    id,
    type: 'A',
    subtype: 'А6',
    source: 'fipi',
    difficulty: 'base',
    units: 'percent',
    title: equal
      ? 'График долга с равным шагом — на сколько процентов больше'
      : 'График долга с неравным шагом — на сколько процентов больше',
    forbid: equal
      ? [{ d: 10, r: 5 }]
      : [
          { T: 350, r: 4 },
          { T: 370, r: 4 },
        ],
    make({ rng, plot }) {
      const r = D(rng.pick(['2', '3', '4', '5', '6']));
      let shares: Drob[];
      if (equal) {
        const d = rng.pick([4, 5, 6, 8, 10, 12, 15]);
        shares = [0, 1, 2, 3, 4, 5].map((i) => D(100 - d * i));
        shares.push(D(0));
      } else {
        const picks = rng
          .sample([95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5], 5)
          .sort((a, b) => b - a);
        shares = [D(100), ...picks.map((x) => D(x)), D(0)];
      }
      const starts = shares.slice(0, 6);
      const T = sum(starts);
      const p = T.mul(r).div(100);
      if (!isNice(p, 2)) return null;
      const rows = byDebts(100, shares.slice(1), r);
      const start = rng.int(0, 11);
      const tbl = scheduleTable(start, shares, 'pct');
      const params: Record<string, number> = { T: T.toNumber(), r: r.toNumber() };
      if (equal) params.d = 100 - shares[1]!.toNumber();
      return {
        condition:
          `15-го ${MONTHS_GEN[start]} ${plot.subject} ${v(plot, 'взял', 'взяла')} полугодовой кредит ${plot.goal}. В таблице представлен график его погашения.\n` +
          `В конце каждого месяца, начиная с ${MONTHS_GEN[start]}, текущий долг увеличивался на ${pct(r)}, а выплаты по погашению кредита происходили в первой половине каждого месяца, начиная с ${MONTHS_GEN[(start + 1) % 12]}. ` +
          `На сколько процентов общая сумма выплат при таких условиях больше суммы самого кредита?`,
        conditionTable: { head: tbl.head, rows: tbl.rows },
        answer: p,
        verify: overpay(rows),
        params,
        rows,
        scheme: 'dif',
        period: 'month',
        labels: tbl.dates.slice(1),
        solution: [
          stTable(
            'Считаем в процентах от кредита: кредит — 100 %. Сумма изменения долга за месяц — разность соседних чисел графика, переплата — ' +
              num(r) +
              ' % от долга на начало месяца.',
          ),
          step(
            'Сумма изменений долга',
            'Долг уменьшился со 100 % до нуля, значит, все изменения вместе дают 100 %, то есть $S$.',
            'S',
          ),
          step(
            'Складываем переплаты',
            'Переплата — ставка, умноженная на сумму долгов на начало месяцев.',
            `\\frac{${tex(r)}}{100}\\,(${starts.map((x) => tex(x)).join(' + ')}) = \\frac{${tex(r)}}{100}\\cdot ${tex(T)} = ${tex(p)}`,
          ),
          stAnswer(`Общая сумма выплат больше кредита на ${pct(p)}.`),
        ],
        hints: [
          hintType('A', rng.int(0, 2)),
          hintChangeSum(rng.int(0, 2)),
          choice(
            'Как найти переплату по графику?',
            `$\\dfrac{r}{100}\\cdot$ (сумма долгов на начало месяцев)`,
            [`$\\dfrac{r}{100}\\cdot$ (сумма долгов на конец месяцев)`, '$r \\cdot 6$'],
            rng.int(0, 2),
          ),
        ],
      };
    },
  };
}

const A10: Prototype = {
  id: 'A-10',
  type: 'A',
  subtype: 'А6',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2016',
  difficulty: 'base',
  units: 'percent',
  title: 'График долга в млн — наибольшая целая ставка при ограничении на выплаты',
  forbid: [
    { T: 26, N: 120 },
    { T: 31, N: 125 },
  ],
  make({ rng, plot }) {
    const S = rng.pick([1, 2, 3]);
    const picks = rng
      .sample([9, 8, 7, 6, 5, 4, 3, 2, 1], 5)
      .sort((a, b) => b - a)
      .map((x) => D(x * S, 10));
    const shares = [D(S), ...picks, D(0)];
    const T = sum(shares.slice(0, 6)).div(S); // сумма долгов на начало в долях S
    const r0 = rng.int(3, 15);
    // сумма выплат: S(1 + rT/100) < N; граница между r0 и r0+1
    const lo = D(S).mul(D(1).add(T.mul(r0).div(100)));
    const hi = D(S).mul(D(1).add(T.mul(r0 + 1).div(100)));
    const N = D(lo.mul(100).floor() + 1n).div(100);
    if (!N.lt(hi) && !N.eq(hi)) return null;
    const total = (r: number) => totalPaid(byDebts(S, shares.slice(1), r));
    const best = largestInt((r) => total(r).lt(N), 1, 60);
    if (best === null) return null;
    const start = rng.int(0, 11);
    const tbl = scheduleTable(start, shares, 'mln');
    return {
      condition:
        `15-го ${MONTHS_GEN[start]} ${plot.subject} ${v(plot, 'планирует', 'планирует')} взять кредит ${plot.goal} на шесть месяцев в размере ${money(S, 'mln')}. Условия его возврата таковы:\n` +
        `— 1-го числа каждого месяца долг увеличивается на $r$ процентов по сравнению с концом предыдущего месяца, где $r$ — целое число;\n` +
        `— со 2-го по 14-е число каждого месяца необходимо выплатить часть долга;\n` +
        `— 15-го числа каждого месяца долг должен составлять некоторую сумму в соответствии с таблицей.\n` +
        `Найдите наибольшее значение $r$, при котором общая сумма выплат будет меньше ${money(N, 'mln')}.`,
      conditionTable: { head: tbl.head, rows: tbl.rows },
      answer: D(r0),
      verify: D(best),
      params: { S, T: T.mul(10).toNumber(), N: N.mul(100).toNumber() / S, r0 },
      rows: byDebts(S, shares.slice(1), r0),
      scheme: 'dif',
      period: 'month',
      labels: tbl.dates.slice(1),
      solution: [
        stTable(
          'Сумма изменений долга за полгода равна сумме кредита. Переплата — $r$ % от суммы долгов на начало месяцев.',
        ),
        step(
          'Сумма долгов на начало',
          'Складываем числа графика без последнего нуля.',
          `${shares
            .slice(0, 6)
            .map((x) => tex(x))
            .join(' + ')} = ${tex(T.mul(S))}`,
        ),
        step(
          'Составляем неравенство',
          'Общая сумма выплат — кредит плюс переплата.',
          `${tex(S)} + \\frac{r}{100}\\cdot ${tex(T.mul(S))} < ${tex(N)} \\;\\Rightarrow\\; r < \\frac{(${tex(N)} - ${tex(S)})\\cdot 100}{${tex(T.mul(S))}}`,
        ),
        step(
          'Выбираем целое',
          `Правая часть больше ${r0}, но не больше ${r0 + 1}. Наибольшее целое — ${r0}; проверка: при $r = ${r0 + 1}$ сумма выплат уже не меньше ${num(N)} млн.`,
        ),
        stAnswer(`$r = ${r0}$.`),
      ],
      hints: hintsA(rng.int(0, 2)),
    };
  },
};

const A11: Prototype = {
  id: 'A-11',
  type: 'A',
  subtype: 'А9',
  source: 'own',
  sourceNote: 'авторская (лист «Дифференцируемый платёж», по сборнику)',
  difficulty: 'hard',
  units: 'percent',
  title: 'Отношение наибольшего платежа к наименьшему — переплата в процентах',
  forbid: [
    { n: 9, a: 17, b: 9 },
    { n: 7, a: 5, b: 3 },
  ],
  make({ rng, plot }) {
    const n = rng.int(4, 12);
    const r = D(rng.pick(['5', '7.5', '8', '10', '12', '12.5', '15', '20', '25']));
    const ratio = D(100).add(r.mul(n)).div(D(100).add(r));
    const a = Number(ratio.n);
    const b = Number(ratio.d);
    if (a > 60 || b > 60) return null;
    const answer = overpayPct(n, r);
    if (!isNice(answer, 2)) return null;
    let found: Drob = D(0);
    for (let x = 1; x <= 600; x++) {
      const rr = D(x, 10);
      const rows = differentiated(1, n, rr);
      if (rows[0]!.payment.div(rows[n - 1]!.payment).eq(ratio)) found = overpay(rows).mul(100);
    }
    return {
      condition:
        `Банк выдаёт кредит на следующих условиях:\n— раз в год банк начисляет на текущий долг некоторый процент годовых;\n— раз в год после начисления процентов клиент вносит платёж, причём платежи вносятся так, чтобы сумма долга уменьшалась каждый год на одну и ту же величину;\n— отношение наибольшего платежа к наименьшему равно ${a} : ${b}.\n` +
        `${plot.subject} ${v(plot, 'взял', 'взяла')} такой кредит ${plot.goal} на ${years(n)}. Сколько процентов от суммы кредита составит переплата?`,
      answer,
      verify: found,
      params: { n, a, b },
      rows: differentiated(100, n, r),
      scheme: 'dif',
      period: 'year',
      solution: [
        stTable(
          'Наибольший платёж — первый, наименьший — последний: долг на начало в последний год равен $\\dfrac{S}{n}$.',
        ),
        step(
          'Отношение платежей',
          'Первый платёж: $\\dfrac{S}{n} + \\dfrac{r}{100}S$; последний: $\\dfrac{S}{n} + \\dfrac{r}{100}\\cdot\\dfrac{S}{n}$. Сокращаем на $\\dfrac{S}{n}$.',
          `\\frac{1 + \\frac{${n}r}{100}}{1 + \\frac{r}{100}} = \\frac{${a}}{${b}} \\;\\Rightarrow\\; \\frac{100 + ${n}r}{100 + r} = \\frac{${a}}{${b}}`,
        ),
        step(
          'Находим ставку',
          'Перемножаем крест-накрест.',
          `${b}(100 + ${n}r) = ${a}(100 + r) \\;\\Rightarrow\\; r = ${tex(r)}`,
        ),
        stDerive('year'),
        step(
          'Переплата в процентах',
          'Подставляем срок и ставку.',
          `\\frac{${n}+1}{2}\\cdot ${tex(r)}\\,\\% = ${tex(answer)}\\,\\%`,
        ),
        stAnswer(`Переплата составит ${pct(answer)} от кредита.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'Какой платёж наименьший?',
          'Последний',
          ['Первый', 'Средний'],
          rng.int(0, 2),
          'В последний год долг на начало самый маленький: $\\dfrac{S}{n}$.',
        ),
      ]),
    };
  },
};

const A12: Prototype = {
  id: 'A-12',
  type: 'A',
  subtype: 'А3',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2019',
  difficulty: 'base',
  units: 'percent',
  title: 'По переплате в процентах найти месячную ставку t',
  forbid: [
    { n: 23, p: 36 },
    { n: 19, p: 40 },
    { n: 15, p: 15 },
  ],
  make({ rng, plot }) {
    const n = rng.int(9, 36);
    const t = D(rng.pick(['1', '1.5', '2', '2.5', '3', '3.5', '4', '5']));
    const p = overpayPct(n, t);
    if (!isNice(p, 1) || p.gt(80)) return null;
    let found: Drob = D(0);
    for (let x = 1; x <= 100; x++)
      if (
        overpay(differentiated(1, n, D(x, 2)))
          .mul(100)
          .eq(p)
      )
        found = D(x, 2);
    return {
      condition: `${frame15(plot, rng.int(0, 11), n, '$t$ %')}\nИзвестно, что общая сумма денег, которую нужно выплатить банку за весь срок кредитования, на ${pct(p)} больше, чем сумма, взятая в кредит. Найдите $t$.`,
      answer: t,
      verify: found,
      params: { n, p: p.toNumber() },
      rows: differentiated(100, n, t),
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable('Сумму кредита примем за 100 %.'),
        stDerive(),
        step(
          'Составляем уравнение',
          `Переплата — ${num(p)} % от $S$.`,
          `\\frac{${n}+1}{2}\\cdot t = ${tex(p)}`,
        ),
        step(
          'Находим $t$',
          'Делим на коэффициент при $t$.',
          `t = \\frac{2\\cdot ${tex(p)}}{${n + 1}} = ${tex(t)}`,
        ),
        stAnswer(`$t = ${tex(t)}$.`),
      ],
      hints: hintsA(rng.int(0, 2)),
    };
  },
};

const A13: Prototype = {
  id: 'A-13',
  type: 'A',
  subtype: 'А7',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'На сколько больше выплатит при другом сроке',
  forbid: [
    { S: 800, r: 5, n1: 24, n2: 30 },
    { S: 900, r: 4, n1: 12, n2: 18 },
  ],
  make({ rng, plot }) {
    const S = D(rng.int(6, 40) * 50); // тыс.
    const r = D(rng.pick(['1', '2', '3', '4', '5']));
    const n1 = rng.int(6, 30);
    const n2 = rng.int(n1 + 2, 36);
    const diff = S.mul(r)
      .div(100)
      .mul(n2 - n1)
      .div(2); // тыс.
    const answer = diff.mul(1000);
    if (!answer.isInteger()) return null;
    const verify = totalPaid(differentiated(S, n2, r))
      .sub(totalPaid(differentiated(S, n1, r)))
      .mul(1000);
    return {
      condition: `${frame15(plot, rng.int(0, 11), n1, r).replace('взять кредит', `взять кредит на сумму ${money(S, 'thous')}`)}\nНа сколько рублей больше придётся выплатить банку, если взять кредит на тех же условиях на ${months(n2)}?`,
      answer,
      verify,
      params: { S: S.toNumber(), r: r.toNumber(), n1, n2 },
      rows: differentiated(S, n1, r),
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable(`Таблица для срока ${n1} месяцев; для ${n2} месяцев она устроена так же.`),
        stDerive(),
        step(
          'Разность переплат',
          'Сумма кредита одна и та же, поэтому разница сумм выплат — это разница переплат.',
          `${tex(S)}\\cdot\\frac{${tex(r)}}{100}\\cdot\\Big(\\frac{${n2 + 1}}{2} - \\frac{${n1 + 1}}{2}\\Big) = ${tex(S)}\\cdot\\frac{${tex(r)}}{100}\\cdot\\frac{${n2 - n1}}{2} = ${tex(diff)}`,
        ),
        step(
          'Переводим в рубли',
          'Считали в тысячах, ответ нужен в рублях.',
          `${tex(diff)}\\ \\text{тыс.} = ${tex(answer)}\\ \\text{руб.}`,
        ),
        stAnswer(`На ${money(answer, 'rub')} больше.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'В каких единицах ответ?',
          'В рублях — переводим из тысяч',
          ['В тысячах рублей, как в условии', 'В процентах'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A15: Prototype = {
  id: 'A-15',
  type: 'A',
  subtype: 'А4',
  source: 'fipi',
  difficulty: 'base',
  units: 'rub',
  title: 'По общей сумме выплат найти сумму кредита',
  forbid: [{ n: 16, r: 2, Z: 1404 }],
  make({ rng, plot }) {
    const n = rng.int(8, 30);
    const r = D(rng.pick(['1', '2', '3', '4']));
    const S = D(rng.int(30, 300) * 10); // тыс.
    const Z = S.mul(
      D(1).add(
        D(n + 1)
          .mul(r)
          .div(200),
      ),
    );
    if (!isNice(Z, 1)) return null;
    const coef = D(1).add(
      D(n + 1)
        .mul(r)
        .div(200),
    );
    return {
      condition: `${frame15(plot, rng.int(0, 11), n, r)}\nКакую сумму ${plot.firm ? 'компания берёт' : `${plot.subject} ${v(plot, 'берёт', 'берёт')}`} в кредит, если общая сумма выплат составит ${money(Z, 'thous')}? Ответ выразите в рублях.`,
      answer: S.mul(1000),
      verify: Z.div(totalPaid(differentiated(1, n, r))).mul(1000),
      params: { n, r: r.toNumber(), Z: Z.toNumber() },
      rows: differentiated(S, n, r),
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable('Сумму кредита обозначим $S$ и будем считать в тысячах рублей.'),
        stDerive(),
        stTotal(),
        step(
          'Составляем уравнение',
          'Подставляем срок, ставку и общую сумму.',
          `S\\Big(1 + \\frac{${n + 1}}{2}\\cdot\\frac{${tex(r)}}{100}\\Big) = ${tex(Z)} \\;\\Rightarrow\\; ${tex(coef)}\\,S = ${tex(Z)}`,
        ),
        step(
          'Находим $S$ и переводим в рубли',
          'Делим и переводим тысячи в рубли.',
          `S = ${tex(S)}\\ \\text{тыс.} = ${tex(S.mul(1000))}\\ \\text{руб.}`,
        ),
        stAnswer(`В кредит взято ${money(S.mul(1000), 'rub')}.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'В каких единицах ответ?',
          'В рублях — переводим из тысяч',
          ['В тысячах рублей', 'В миллионах рублей'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A16: Prototype = {
  id: 'A-16',
  type: 'A',
  subtype: 'А5',
  source: 'fipi',
  sourceNote: 'по задаче ЕГЭ-2021',
  difficulty: 'base',
  units: 'rub',
  title: 'По общей сумме выплат найти срок и разность двух платежей',
  forbid: [
    { S: 12, r: 10, Z: 18.6 },
    { S: 16, r: 5, Z: 20.4 },
  ],
  make({ rng, plot }) {
    const S = D(rng.int(6, 30));
    const r = D(rng.pick(['5', '8', '10', '12', '15', '20']));
    const n = rng.int(6, 20);
    const Z = S.mul(
      D(1).add(
        D(n + 1)
          .mul(r)
          .div(200),
      ),
    );
    if (!isNice(Z, 2)) return null;
    const i = rng.int(1, n - 2);
    const j = rng.int(i + 1, n);
    const diff = S.div(n)
      .mul(r)
      .div(100)
      .mul(j - i); // млн
    const answer = diff.mul(1_000_000);
    if (!answer.isInteger()) return null;
    let nFound = 0;
    for (let k = 1; k <= 60; k++) if (totalPaid(differentiated(S, k, r)).eq(Z)) nFound = k;
    const rowsF = nFound ? differentiated(S, nFound, r) : [];
    const verify = nFound ? rowsF[i - 1]!.payment.sub(rowsF[j - 1]!.payment).mul(1_000_000) : D(0);
    const ordWord = (k: number) => `${k}-й`;
    return {
      condition: `${frameJuly(plot, money(S, 'mln'), null, r)}\nНа сколько рублей ${ordWord(i)} платёж больше ${j}-го, если общая сумма выплат после полного погашения кредита равна ${money(Z, 'mln')}?`,
      answer,
      verify,
      params: { S: S.toNumber(), r: r.toNumber(), Z: Z.toNumber(), i, j },
      rows: differentiated(S, n, r),
      scheme: 'dif',
      period: 'year',
      extra: [i, j],
      solution: [
        stTable(
          'Срок $n$ неизвестен. Сумма изменения долга каждый год $\\dfrac{S}{n}$, переплата — от долга на начало года.',
        ),
        stDerive('year'),
        step(
          'Находим срок',
          'Переплата — разность общей суммы и кредита.',
          `${tex(Z)} - ${tex(S)} = ${tex(S)}\\cdot\\frac{n+1}{2}\\cdot\\frac{${tex(r)}}{100} \\;\\Rightarrow\\; n = ${n}`,
        ),
        step(
          'Разность платежей',
          `Платежи отличаются только переплатой: долг на начало ${i}-го года больше, чем ${j}-го, на ${j - i} ${plural(j - i, 'сумму', 'суммы', 'сумм')} изменения долга.`,
          `\\frac{${tex(r)}}{100}\\cdot ${j - i}\\cdot\\frac{${tex(S)}}{${n}} = ${tex(diff)}\\ \\text{млн} = ${tex(answer)}\\ \\text{руб.}`,
        ),
        stAnswer(`На ${money(answer, 'rub')}.`),
      ],
      hints: hintsA(rng.int(0, 2), [
        choice(
          'Чем отличаются два платежа?',
          'Только переплатой: сумма изменения долга одна и та же',
          ['Только суммой изменения долга', 'Ничем'],
          rng.int(0, 2),
        ),
      ]),
    };
  },
};

const A17: Prototype = {
  id: 'A-17',
  type: 'A',
  subtype: 'А5',
  source: 'fipi',
  difficulty: 'base',
  units: 'thous',
  title: 'Сколько вернуть за первый год',
  forbid: [{ S: 1.8, r: 1, n: 24 }],
  make({ rng, plot }) {
    const n = rng.pick([24, 36]);
    const S = D(rng.pick(['1.2', '1.5', '2.4', '3', '3.6', '4.8', '6', '7.2'])); // млн
    const r = D(rng.pick(['0.5', '1', '1.5', '2', '2.5', '3']));
    const sumStarts = (n + n - 11) * 6; // n + … + (n−11)
    if (!S.mul(1000).div(n).isInteger()) return null;
    const first = S.mul(12).div(n).add(r.div(100).mul(S).div(n).mul(sumStarts)).mul(1000); // тыс.
    if (!isNice(first, 1)) return null;
    const rows = differentiated(S, n, r);
    return {
      condition:
        `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} в размере ${money(S, 'mln')} на ${months(n)}. По договору нужно возвращать банку часть денег в конце каждого месяца. Каждый месяц общая сумма долга возрастает на ${pct(r)}, а затем уменьшается на сумму платежа. ` +
        `Платежи подбираются так, чтобы сумма долга уменьшалась равномерно, то есть на одну и ту же величину каждый месяц. Какую сумму нужно вернуть банку в течение первого года кредитования? Ответ выразите в тысячах рублей.`,
      answer: first,
      verify: sum(rows.slice(0, 12).map((x) => x.payment)).mul(1000),
      params: { S: S.toNumber(), r: r.toNumber(), n },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [12, 13],
      solution: [
        stTable(
          `Считаем в тысячах рублей: $S = ${tex(S.mul(1000))}$. Сумма изменения долга каждый месяц $\\dfrac{S}{${n}} = ${tex(S.mul(1000).div(n))}$.`,
        ),
        step(
          'Изменения долга за год',
          'За 12 месяцев долг уменьшился на 12 одинаковых сумм.',
          `12\\cdot ${tex(S.mul(1000).div(n))} = ${tex(S.mul(12000).div(n))}`,
        ),
        step(
          'Переплаты за год',
          `Долги на начало месяцев первого года: $${n}x, ${n - 1}x, \\dots, ${n - 11}x$, где $x = ${tex(S.mul(1000).div(n))}$ — это арифметическая прогрессия.`,
          `\\frac{${tex(r)}}{100}\\cdot x\\cdot(${n} + ${n - 1} + \\dots + ${n - 11}) = \\frac{${tex(r)}}{100}\\cdot ${tex(S.mul(1000).div(n))}\\cdot ${sumStarts} = ${tex(first.sub(S.mul(12000).div(n)))}`,
        ),
        step(
          'Складываем',
          'Выплаты за год — изменения долга плюс переплаты.',
          `${tex(S.mul(12000).div(n))} + ${tex(first.sub(S.mul(12000).div(n)))} = ${tex(first)}`,
        ),
        stAnswer(`За первый год нужно вернуть ${money(first, 'thous')}.`),
      ],
      hints: hintsA(rng.int(0, 2)),
    };
  },
};

const A18: Prototype = {
  id: 'A-18',
  type: 'A',
  subtype: 'А5',
  source: 'own',
  sourceNote: 'авторская (рабочая тетрадь)',
  difficulty: 'base',
  units: 'rub',
  title: 'Платёж k-го месяца',
  forbid: [{ S: 900000, n: 5, r: 2, k: 3 }],
  make({ rng, plot }) {
    const n = rng.int(4, 12);
    const r = D(rng.pick(['1', '1.5', '2', '2.5', '3', '4', '5']));
    const S = D(rng.int(5, 90) * 10000 * n);
    const k = rng.int(2, n);
    const z = S.div(n).mul(D(1).add(r.mul(n - k + 1).div(100)));
    if (!z.isInteger() || S.gt(3_000_000)) return null;
    const rows = differentiated(S, n, r);
    return {
      condition: `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal}: ${money(S, 'rub')} на ${months(n)} под ${pct(r)} в месяц. Платежи подобраны так, что сумма долга каждый месяц уменьшается на одну и ту же величину. Найдите платёж ${k}-го месяца. Ответ дайте в рублях.`,
      answer: z,
      verify: rows[k - 1]!.payment,
      params: { S: S.toNumber(), n, r: r.toNumber(), k },
      rows,
      scheme: 'dif',
      period: 'month',
      extra: [k],
      solution: [
        stTable(
          `Сумма изменения долга каждый месяц: $\\dfrac{${tex(S)}}{${n}} = ${tex(S.div(n))}$.`,
        ),
        step(
          `Долг в начале ${k}-го месяца`,
          `Прошло ${k - 1} ${k - 1 === 1 ? 'месяц' : k - 1 < 5 ? 'месяца' : 'месяцев'}, долг уменьшился на столько же сумм изменения.`,
          `${tex(S)} - ${k - 1}\\cdot ${tex(S.div(n))} = ${tex(S.sub(S.div(n).mul(k - 1)))}`,
        ),
        step(
          'Переплата за месяц',
          `${num(r)} % от долга на начало месяца.`,
          `${tex(S.sub(S.div(n).mul(k - 1)))}\\cdot\\frac{${tex(r)}}{100} = ${tex(
            S.sub(S.div(n).mul(k - 1))
              .mul(r)
              .div(100),
          )}`,
        ),
        step(
          'Платёж',
          'Сумма изменения долга плюс переплата.',
          `${tex(S.div(n))} + ${tex(
            S.sub(S.div(n).mul(k - 1))
              .mul(r)
              .div(100),
          )} = ${tex(z)}`,
        ),
        stAnswer(`Платёж ${k}-го месяца — ${money(z, 'rub')}.`),
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
          'Из чего складывается платёж?',
          'Сумма изменения долга плюс переплата',
          ['Только переплата', 'Долг на начало минус переплата'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

const A19: Prototype = {
  id: 'A-19',
  type: 'A',
  subtype: 'А4',
  source: 'own',
  sourceNote: 'авторская (рабочая тетрадь)',
  difficulty: 'base',
  units: 'rub',
  title: 'По первому платежу найти сумму кредита',
  forbid: [{ n: 10, r: 3, z: 78000 }],
  make({ rng, plot }) {
    const n = rng.int(4, 12);
    const r = D(rng.pick(['1', '1.5', '2', '2.5', '3', '4', '5']));
    const S = D(rng.int(10, 200) * 10000);
    const z1 = S.div(n).mul(D(1).add(r.mul(n).div(100)));
    if (!z1.isInteger()) return null;
    const rows = differentiated(S, n, r);
    return {
      condition: `${plot.subject} ${v(plot, 'взял', 'взяла')} кредит ${plot.goal} на ${months(n)} под ${pct(r)} в месяц, причём сумма долга каждый месяц уменьшается на одну и ту же величину. Первый платёж составил ${money(z1, 'rub')}. Найдите сумму кредита. Ответ дайте в рублях.`,
      answer: S,
      verify: z1.div(differentiated(1, n, r)[0]!.payment),
      params: { n, r: r.toNumber(), z: z1.toNumber() },
      rows,
      scheme: 'dif',
      period: 'month',
      solution: [
        stTable('Сумму кредита обозначим $S$. В первый месяц долг на начало — весь кредит.'),
        step(
          'Первый платёж',
          'Сумма изменения долга плюс переплата за первый месяц.',
          `\\frac{S}{${n}} + \\frac{${tex(r)}}{100}\\,S = ${tex(z1)}`,
        ),
        step(
          'Находим $S$',
          'Выносим $S$ за скобку.',
          `S\\Big(\\frac{1}{${n}} + \\frac{${tex(r)}}{100}\\Big) = ${tex(z1)} \\;\\Rightarrow\\; S = ${tex(S)}`,
        ),
        stAnswer(`Сумма кредита — ${money(S, 'rub')}.`),
      ],
      hints: [
        hintType('A', rng.int(0, 2)),
        choice(
          'Чему равен долг на начало первого месяца?',
          'Всей сумме кредита $S$',
          ['$\\dfrac{S}{n}$', 'Нулю'],
          rng.int(0, 2),
        ),
      ],
    };
  },
};

export const PROTO_A: Prototype[] = [
  A01,
  A02,
  A03,
  A04,
  A05,
  A06,
  A07,
  A08,
  makeSchedule('A-09', true),
  A10,
  A11,
  A12,
  A13,
  makeSchedule('A-14', false),
  A15,
  A16,
  A17,
  A18,
  A19,
];
