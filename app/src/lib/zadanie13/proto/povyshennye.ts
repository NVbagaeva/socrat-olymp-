/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №13.
 * В реестр PROTOTYPES не входят — в банк, тренажёр и генератор №13 не
 * попадают. Числа и сюжет задаёт вариант (`generateFixed`), решение и
 * подсказки — общими кирпичами типа A (дифференцированный платёж).
 */

import { D, type DrobInput } from '../drob';
import { v, type PlotFull } from '../plots';
import { difPereplata, type DifItog } from '../reshenie';
import { byDebts, byPayments, deposit, differentiated, equalPayment, totalPaid } from '../solver';
import { frameJan, frameJuly, money, pct, years } from '../text';
import { choice, hintChangeSum, hintK, hintOverpayFormula, hintType, step, tex } from './common';
import type { Prototype } from './types';

export interface ObshchayaSumma {
  /** Сумма кредита, млн рублей. */
  S: DrobInput;
  /** Срок, лет. */
  n: number;
  /** Годовая ставка, %. */
  r: DrobInput;
}

/**
 * Годовой дифференцированный кредит (рамка «июль»): найти общую сумму
 * выплат в рублях, когда сумма кредита дана в миллионах. Подвох —
 * переплата через прогрессию и перевод миллионов в рубли.
 */
export function obshchayaSummaGod(par: ObshchayaSumma): Prototype {
  const S = D(par.S);
  const r = D(par.r);
  const n = par.n;
  const Srub = S.mul(1_000_000);
  return {
    id: 'PV-A-SUM',
    type: 'A',
    subtype: 'А1',
    source: 'own',
    difficulty: 'base',
    units: 'rub',
    title: 'Годовой дифференцированный: общая сумма выплат в рублях',
    maxDecimals: 0,
    make({ plot }: { plot: PlotFull }) {
      const answer = Srub.mul(
        D(1).add(
          D(n + 1)
            .mul(r)
            .div(200),
        ),
      );
      const rows = differentiated(Srub, n, r);
      const { shagi, itogi } = difPereplata([{ n, r }], 'year', { bezProcentov: true });
      const k = (itogi[0] as DifItog).koef!;
      const pereplata = Srub.mul(k);
      return {
        condition: `${frameJuly(plot, money(S, 'mln'), n, r)}\nСколько рублей ${plot.subject} ${v(plot, 'отдаст', 'отдаст')} банку за всё время кредитования, считая и сам кредит, и проценты?`,
        answer,
        verify: totalPaid(rows),
        params: { S: S.toNumber(), n, r: r.toNumber() },
        rows,
        scheme: 'dif',
        period: 'year',
        solution: [
          ...shagi,
          step(
            'Переводим сумму кредита в рубли',
            'Спрашивают ответ в рублях, а кредит дан в миллионах.',
            `S = ${tex(S)}\\ \\text{млн} = ${tex(Srub)}\\ \\text{руб.}`,
          ),
          step(
            'Общая сумма выплат',
            'Вернуть банку нужно всё, что взяли, и переплату.',
            `S_{\\text{общ}} = S + ${tex(k)}S = ${tex(Srub)} + ${tex(pereplata)} = ${tex(answer)}`,
          ),
          step('Ответ', `Всего будет выплачено ${money(answer, 'rub')}.`),
        ],
        vopros: 'rubli',
        hints: [
          hintType('A', 0),
          hintChangeSum(1),
          hintOverpayFormula(2),
          choice(
            'Что спрашивают в задаче?',
            'Всё, что вернут банку: кредит плюс переплата',
            ['Только переплату — проценты банку', 'Величину одного годового платежа'],
            1,
          ),
        ],
      };
    },
  };
}

/* ── Вклад: пополнение через год, найти ставку ─────────────────── */

export interface StavkaVklada {
  /** Вклад, тыс. рублей. */
  S: number;
  /** Пополнение через год, тыс. рублей. */
  x: number;
  /** Сумма на счёте ещё через год, тыс. рублей. */
  Z: DrobInput;
}

/**
 * Январь: вклад S. Каждый декабрь — r % на сумму вклада. Через год (в
 * январе) пополнение на x, ещё через год на счёте Z. Найти r. Подвох —
 * уравнение квадратное относительно k = 1 + r/100, а не линейное по r.
 */
export function stavkaVklada(par: StavkaVklada): Prototype {
  const S = D(par.S);
  const x = D(par.x);
  const Z = D(par.Z);
  return {
    id: 'PV-D-STAVKA',
    type: 'D',
    subtype: 'Г',
    source: 'own',
    difficulty: 'base',
    units: 'percent',
    title: 'Вклад с пополнением через год: найти ставку по итоговой сумме',
    plot: { kind: 'deposit' },
    make({ plot }: { plot: PlotFull }) {
      /* k — положительный корень Sk² + xk − Z = 0; дискриминант — полный квадрат. */
      const Dsk = x.mul(x).add(S.mul(Z).mul(4));
      const kor = Math.round(Math.sqrt(Dsk.toNumber()) * 1e6) / 1e6;
      const koren = D(String(kor));
      if (!koren.mul(koren).eq(Dsk)) return null;
      const k = koren.sub(x).div(S.mul(2));
      const r = k.sub(1).mul(100);
      if (!r.isInteger() || r.lt(1)) return null;
      /* Второй счёт: перебор целых ставок прямым пересчётом вклада. */
      let found = D(0);
      for (let t = 1; t <= 100; t += 1) {
        if (deposit(S, 2, t, { after: [x, 0] })[1]!.end.eq(Z)) found = D(t);
      }
      const rows = deposit(S, 2, r, { after: [x, 0] });
      const y = plot.year;
      return {
        condition:
          `В январе ${y} года ${plot.subject} ${v(plot, 'открыл', 'открыла')} вклад${plot.goal.startsWith('чтобы') ? `, ${plot.goal},` : ` ${plot.goal}`} и ${v(plot, 'положил', 'положила')} на него ${money(S, 'thous')}. ` +
          'Каждый год в декабре банк увеличивает сумму на вкладе на одно и то же число процентов (начисляет $r$ % годовых). ' +
          `В январе ${y + 1} года ${plot.subject} ${v(plot, 'пополнил', 'пополнила')} вклад на ${money(x, 'thous')}, а в январе ${y + 2} года на счёте было ${money(Z, 'thous')}. Найдите $r$.`,
        answer: r,
        verify: found,
        params: { S: S.toNumber(), x: x.toNumber(), Z: Z.toNumber() },
        rows,
        scheme: 'dep',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в тыс. рублей. Таблица — при найденной ставке.',
            undefined,
            true,
          ),
          step(
            'Составляем уравнение',
            'Обозначим $k = 1 + \\dfrac{r}{100}$. За первый год вклад умножился на $k$, затем добавили пополнение, и за второй год вся сумма снова умножилась на $k$.',
            `(${tex(S)}k + ${tex(x)})\\,k = ${tex(Z)} \\;\\Rightarrow\\; ${tex(S)}k^2 + ${tex(x)}k - ${tex(Z)} = 0`,
          ),
          step(
            'Решаем',
            'Подходит только положительный корень.',
            `\\mathcal D = ${tex(x)}^2 + 4\\cdot ${tex(S)}\\cdot ${tex(Z)} = ${tex(Dsk)} = ${tex(koren)}^2,\\quad k = \\dfrac{-${tex(x)} + ${tex(koren)}}{2\\cdot ${tex(S)}} = ${tex(k)}`,
          ),
          step('Ответ', `$k = ${tex(k)}$, значит, $r = ${tex(r)}$ %.`),
        ],
        vopros: 'stavka',
        hints: [
          hintType('D', 0),
          hintK(1),
          choice(
            'Какое уравнение получится?',
            `$(${tex(S)}k + ${tex(x)})k = ${tex(Z)}$`,
            [`$${tex(S)}k + ${tex(x)}k = ${tex(Z)}$`, `$(${tex(S)} + ${tex(x)})k^2 = ${tex(Z)}$`],
            2,
            'Пополнение внесли после первого начисления: проценты на него начислялись один раз.',
          ),
        ],
      };
    },
  };
}

/* ── Долг убывает на q % в год: последний платёж ────────────────── */

export interface PosledniyPlatezh {
  /** Кредит, млн рублей. */
  S: DrobInput;
  /** Срок, лет. */
  n: number;
  r: DrobInput;
  /** На сколько процентов долг каждый июль меньше прошлогоднего. */
  q: DrobInput;
}

/**
 * Рамка «июль»: в июле каждого года, кроме последнего, долг на q %
 * меньше, чем годом раньше, к концу срока кредит погашен. Найти
 * последний платёж в рублях. Подвох — долг убывает не на одну и ту же
 * величину, а в одно и то же число раз; последний платёж — остаток
 * долга с процентами.
 */
export function posledniyPlatezh(par: PosledniyPlatezh): Prototype {
  const S = D(par.S);
  const r = D(par.r);
  const q = D(par.q);
  const n = par.n;
  const Srub = S.mul(1_000_000);
  const m = D(1).sub(q.div(100));
  return {
    id: 'PV-B-POSLEDNIY',
    type: 'B',
    subtype: 'Б',
    source: 'own',
    difficulty: 'base',
    units: 'rub',
    title: 'Долг каждый год меньше на $q\\,\\%$: последний платёж в рублях',
    maxDecimals: 0,
    make({ plot }: { plot: PlotFull }) {
      const ost = Srub.mul(m.pow(n - 1));
      const answer = ost.mul(D(1).add(r.div(100)));
      const ends = Array.from({ length: n }, (_, i) =>
        i === n - 1 ? D(0) : Srub.mul(m.pow(i + 1)),
      );
      const rows = byDebts(Srub, ends, r);
      const y = plot.year;
      const godyText = Array.from({ length: n - 1 }, (_, i) => String(y + 1 + i));
      const gody = `${godyText.slice(0, -1).join(', ')} и ${godyText.at(-1)}`;
      return {
        condition:
          `В июле ${y} года ${plot.subject} ${v(plot, 'планирует', 'планирует')} взять кредит ${plot.goal} в размере ${money(S, 'mln')} на ${years(n)}. Условия его возврата таковы:\n` +
          `— каждый январь долг возрастает на ${pct(r)} по сравнению с концом предыдущего года;\n` +
          '— с февраля по июнь каждого года необходимо выплатить часть долга;\n' +
          `— в июле ${gody} годов долг должен быть на ${pct(q)} меньше долга на июль предыдущего года;\n` +
          `— к июлю ${y + n} года кредит должен быть полностью погашен.\n` +
          `Сколько рублей составит платёж ${y + n} года?`,
        answer,
        verify: rows[n - 1]!.payment,
        params: { S: S.toNumber(), n, r: r.toNumber(), q: q.toNumber() },
        rows,
        scheme: 'dif',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в рублях: кредит дан в миллионах, ответ спрашивают в рублях.',
            undefined,
            true,
          ),
          step(
            'Как меняется долг',
            `«На ${pct(q)} меньше» — долг в июле умножается на $${tex(m)}$. Он убывает не на одну и ту же величину, а в одно и то же число раз.`,
            `S_{${n - 1}} = ${tex(Srub)}\\cdot ${tex(m)}^{${n - 1}} = ${tex(ost)}`,
          ),
          step(
            'Последний платёж',
            `К июлю ${y + n} года долг $S_{${n - 1}}$ вместе с январскими процентами выплачивается целиком.`,
            `x_{${n}} = ${tex(ost)}\\cdot ${tex(D(1).add(r.div(100)))} = ${tex(answer)}`,
          ),
          step('Ответ', `Платёж ${y + n} года — ${money(answer, 'rub')}.`),
        ],
        vopros: 'rubli',
        hints: [
          choice(
            `Как меняется долг в июле ${y + 1}–${y + n - 1} годов?`,
            `Умножается на $${tex(m)}$`,
            [
              `Уменьшается на $${tex(q.div(100).mul(S))}$ млн каждый год`,
              'Уменьшается на одну и ту же величину',
            ],
            0,
          ),
          choice(
            'Какой долг остаётся к последнему году?',
            `$${tex(Srub)}\\cdot ${tex(m)}^{${n - 1}} = ${tex(ost)}$`,
            [`$${tex(Srub)}\\cdot ${tex(m)}^{${n}}$`, `$${tex(Srub)}\\cdot ${tex(m)}$`],
            1,
          ),
          choice(
            'Чему равен последний платёж?',
            `Остаток долга с процентами: $${tex(ost)}\\cdot ${tex(D(1).add(r.div(100)))}$`,
            [`Остаток долга: $${tex(ost)}$`, 'Проценты на остаток'],
            2,
          ),
        ],
      };
    },
  };
}

/* ── Дифференцированный: ставка по общей сумме выплат ──────────── */

export interface StavkaPoSumme {
  /** Кредит, тыс. рублей. */
  S: number;
  n: number;
  /** Общая сумма выплат, тыс. рублей. */
  T: number;
}

/**
 * Рамка «июль», долг убывает равномерно; известна общая сумма выплат —
 * найти ставку r. Подвох — переплата идёт со всех долгов на начало
 * года: S·(n + 1)/2·r/100, а не S·n·r/100 и не S·r/100.
 */
export function stavkaPoSumme(par: StavkaPoSumme): Prototype {
  const S = D(par.S);
  const T = D(par.T);
  const n = par.n;
  return {
    id: 'PV-A-STAVKA',
    type: 'A',
    subtype: 'А1',
    source: 'own',
    difficulty: 'base',
    units: 'percent',
    title: 'Годовой дифференцированный: ставка по общей сумме выплат',
    make({ plot }: { plot: PlotFull }) {
      const P = T.sub(S);
      const sred = S.mul(n + 1).div(2);
      const r = P.mul(100).div(sred);
      if (!r.isInteger() || r.lt(1)) return null;
      /* Второй счёт: перебор целых ставок прямым пересчётом таблицы. */
      let found = D(0);
      for (let t = 1; t <= 100; t += 1) {
        if (totalPaid(differentiated(S, n, t)).eq(T)) found = D(t);
      }
      const rows = differentiated(S, n, r);
      return {
        condition: `${frameJuly(plot, money(S, 'thous'), n, '$r$ %')}\nИзвестно, что общая сумма выплат после полного погашения кредита составит ${money(T, 'thous')}. Найдите $r$.`,
        answer: r,
        verify: found,
        params: { S: S.toNumber(), n, T: T.toNumber() },
        rows,
        scheme: 'dif',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в тыс. рублей. Таблица — при найденной ставке.',
            undefined,
            true,
          ),
          step(
            'Переплата',
            'Всё, что отдали сверх кредита, — проценты банку.',
            `S_{\\text{перепл}} = ${tex(T)} - ${tex(S)} = ${tex(P)}`,
          ),
          step(
            'Переплата через ставку',
            n === 2
              ? 'Проценты начисляются на долги на начало каждого года: $S$ и $\\dfrac{1}{2}S$ — их сумма $S\\cdot\\dfrac{3}{2}$.'
              : `Проценты начисляются на долги на начало каждого года: $S$, $\\dfrac{${n - 1}}{${n}}S$, …, $\\dfrac{1}{${n}}S$ — их сумма $S\\cdot\\dfrac{n+1}{2}$.`,
            `S_{\\text{перепл}} = ${tex(S)}\\cdot \\dfrac{${n + 1}}{2}\\cdot\\dfrac{r}{100} = ${tex(sred)}\\cdot\\dfrac{r}{100}`,
          ),
          step(
            'Решаем',
            'Приравниваем две записи переплаты.',
            `${tex(sred)}\\cdot\\dfrac{r}{100} = ${tex(P)} \\;\\Rightarrow\\; r = \\dfrac{${tex(P)}\\cdot 100}{${tex(sred)}} = ${tex(r)}`,
          ),
          step('Ответ', `$r = ${tex(r)}$ %.`),
        ],
        vopros: 'stavka',
        hints: [
          hintType('A', 0),
          choice(
            'Чему равна переплата?',
            `$${tex(T)} - ${tex(S)} = ${tex(P)}$ тыс. рублей`,
            [`$${tex(T)}$ тыс. рублей`, `$${tex(T)} : ${n}$ тыс. рублей`],
            1,
          ),
          hintOverpayFormula(2),
          choice(
            'Какое уравнение получится?',
            `$${tex(sred)}\\cdot\\dfrac{r}{100} = ${tex(P)}$`,
            [
              `$${tex(S.mul(n))}\\cdot\\dfrac{r}{100} = ${tex(P)}$`,
              `$${tex(S)}\\cdot\\dfrac{r}{100} = ${tex(P)}$`,
            ],
            0,
          ),
        ],
      };
    },
  };
}

/* ── Вклад: равные пополнения два года подряд ──────────────────── */

export interface RavnyePopolneniya {
  /** Вклад, тыс. рублей. */
  S: number;
  r: number;
  /** Сумма на счёте через три года, тыс. рублей. */
  Z: number;
}

/**
 * Вклад на три года, в декабре каждого года +r %, в январе второго и
 * третьего года — одинаковые пополнения x. Известна сумма через три
 * года — найти x. Подвох — первое пополнение растёт два раза, второе —
 * один: x(k² + k), а не 2xk и не 2x.
 */
export function ravnyePopolneniya(par: RavnyePopolneniya): Prototype {
  const S = D(par.S);
  const r = D(par.r);
  const Z = D(par.Z);
  return {
    id: 'PV-D-POPOLNENIE',
    type: 'D',
    subtype: 'Г',
    source: 'own',
    difficulty: 'base',
    units: 'thous',
    title: 'Вклад с двумя равными пополнениями: найти пополнение',
    plot: { kind: 'deposit' },
    make({ plot }: { plot: PlotFull }) {
      const k = D(1).add(r.div(100));
      const k3 = k.pow(3);
      const k2k = k.pow(2).add(k);
      const ost = Z.sub(S.mul(k3));
      const x = ost.div(k2k);
      if (!x.isInteger() || !x.isPositive()) return null;
      const rows = deposit(S, 3, r, { after: [x, x, 0] });
      const y = plot.year;
      return {
        condition:
          `В январе ${y} года ${plot.subject} ${v(plot, 'открыл', 'открыла')} вклад${plot.goal.startsWith('чтобы') ? `, ${plot.goal},` : ` ${plot.goal}`} на три года и ${v(plot, 'положил', 'положила')} на него ${money(S, 'thous')}. ` +
          `Каждый год в декабре банк увеличивает сумму на вкладе на ${pct(r)}. ` +
          `В январе ${y + 1} и ${y + 2} годов ${plot.subject} ${v(plot, 'пополнял', 'пополняла')} вклад на одну и ту же сумму, а в январе ${y + 3} года на счёте оказалось ${money(Z, 'thous')}. На какую сумму (в тыс. рублей) ${v(plot, 'пополнял', 'пополняла')} вклад ${plot.subject} каждый раз?`,
        answer: x,
        verify: rows[2]!.end.eq(Z) ? x : D(0),
        params: { S: S.toNumber(), r: r.toNumber(), Z: Z.toNumber() },
        rows,
        scheme: 'dep',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в тыс. рублей. Таблица — при найденном пополнении.',
            undefined,
            true,
          ),
          step(
            'Составляем уравнение',
            `Обозначим пополнение $y$ (как в таблице) и $k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}$. Вклад $${tex(S)}$ вырос три раза, первое пополнение — два раза, второе — один раз.`,
            `${tex(S)}k^3 + yk^2 + yk = ${tex(Z)}`,
          ),
          step(
            'Считаем',
            `$k^3 = ${tex(k3)}$, $k^2 + k = ${tex(k2k)}$.`,
            `${tex(S.mul(k3))} + ${tex(k2k)}y = ${tex(Z)} \\;\\Rightarrow\\; y = \\dfrac{${tex(ost)}}{${tex(k2k)}} = ${tex(x)}`,
          ),
          step('Ответ', `Каждое пополнение — ${money(x, 'thous')}.`),
        ],
        vopros: 'summa',
        hints: [
          hintType('D', 0),
          hintK(1),
          choice(
            'Какое уравнение получится?',
            `$${tex(S)}k^3 + yk^2 + yk = ${tex(Z)}$`,
            [`$${tex(S)}k^3 + 2yk = ${tex(Z)}$`, `$(${tex(S)} + 2y)k^3 = ${tex(Z)}$`],
            2,
            'Первое пополнение лежит на счёте два начисления, второе — одно.',
          ),
        ],
      };
    },
  };
}

/* ── Долг убывает на q % в год: общая сумма выплат ─────────────── */

/**
 * Рамка «июль», как у `posledniyPlatezh`, но спрашивают все выплаты
 * вместе. Подвох — долг убывает в одно и то же число раз, платежи
 * разные, последний гасит остаток с процентами.
 */
export function summaPriUbyvanii(par: PosledniyPlatezh): Prototype {
  const S = D(par.S);
  const r = D(par.r);
  const q = D(par.q);
  const n = par.n;
  const Srub = S.mul(1_000_000);
  const m = D(1).sub(q.div(100));
  const k = D(1).add(r.div(100));
  return {
    id: 'PV-B-SUMMA',
    type: 'B',
    subtype: 'Б',
    source: 'own',
    difficulty: 'base',
    units: 'rub',
    title: 'Долг каждый год меньше на $q\\,\\%$: общая сумма выплат в рублях',
    maxDecimals: 0,
    make({ plot }: { plot: PlotFull }) {
      const dolgi = Array.from({ length: n }, (_, i) => Srub.mul(m.pow(i)));
      const ends = Array.from({ length: n }, (_, i) =>
        i === n - 1 ? D(0) : Srub.mul(m.pow(i + 1)),
      );
      const plat = dolgi.map((dl, i) => dl.mul(k).sub(ends[i]!));
      const answer = plat.reduce((acc, x) => acc.add(x), D(0));
      const rows = byDebts(Srub, ends, r);
      const y = plot.year;
      const godyText = Array.from({ length: n - 1 }, (_, i) => String(y + 1 + i));
      const gody = `${godyText.slice(0, -1).join(', ')} и ${godyText.at(-1)}`;
      return {
        condition:
          `В июле ${y} года ${plot.subject} ${v(plot, 'планирует', 'планирует')} взять кредит ${plot.goal} в размере ${money(S, 'mln')} на ${years(n)}. Условия его возврата таковы:\n` +
          `— каждый январь долг возрастает на ${pct(r)} по сравнению с концом предыдущего года;\n` +
          '— с февраля по июнь каждого года необходимо выплатить часть долга;\n' +
          `— в июле ${gody} годов долг должен быть на ${pct(q)} меньше долга на июль предыдущего года;\n` +
          `— к июлю ${y + n} года кредит должен быть полностью погашен.\n` +
          'Сколько рублей составит общая сумма выплат?',
        answer,
        verify: totalPaid(rows),
        params: { S: S.toNumber(), n, r: r.toNumber(), q: q.toNumber() },
        rows,
        scheme: 'dif',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в рублях: кредит дан в миллионах, ответ спрашивают в рублях.',
            undefined,
            true,
          ),
          step(
            'Как меняется долг',
            `«На ${pct(q)} меньше» — долг в июле умножается на $${tex(m)}$, а не уменьшается на одну и ту же величину.`,
            dolgi.map((dl, i) => `S_{${i}} = ${tex(dl)}`).join(',\\quad '),
          ),
          step(
            'Платежи',
            'Платёж года — долг после январских процентов минус долг, который должен остаться в июле; в последний год остаётся ноль.',
            plat
              .map(
                (x, i) =>
                  `x_{${i + 1}} = ${tex(dolgi[i]!)}\\cdot ${tex(k)} - ${tex(ends[i]!)} = ${tex(x)}`,
              )
              .join(',\\quad '),
          ),
          step(
            'Общая сумма выплат',
            'Складываем платежи всех лет.',
            `${plat.map((x) => tex(x)).join(' + ')} = ${tex(answer)}`,
          ),
          step('Ответ', `Всего будет выплачено ${money(answer, 'rub')}.`),
        ],
        vopros: 'rubli',
        hints: [
          choice(
            `Как меняется долг в июле ${y + 1}–${y + n - 1} годов?`,
            `Умножается на $${tex(m)}$`,
            [
              `Уменьшается на $${tex(q.div(100).mul(S))}$ млн каждый год`,
              'Уменьшается на одну и ту же величину',
            ],
            0,
          ),
          choice(
            'Чему равен платёж года?',
            'Долг после начисления процентов минус долг на июль',
            ['Проценты на долг', 'Разность долгов на июль'],
            1,
          ),
          choice(
            'Что спрашивают в задаче?',
            'Сумму всех платежей',
            ['Последний платёж', 'Переплату — только проценты'],
            2,
          ),
        ],
      };
    },
  };
}

/* ── Партия 3: два равных платежа и вклад с пополнениями ───────── */

export interface DvaRavnyhSumma {
  /** Кредит, тыс. рублей. */
  S: number;
  r: DrobInput;
}

/**
 * Рамка «январь»: кредит на 2 года, погашен двумя равными платежами;
 * найти общую сумму платежей в рублях. Подвох — не «кредит плюс
 * проценты за два года», а 2x, где x = Sk²/(k + 1).
 */
export function dvaRavnyhSumma(par: DvaRavnyhSumma): Prototype {
  const S = D(par.S).mul(1000);
  const r = D(par.r);
  return {
    id: 'PV-C-DVA-SUMMA',
    type: 'C',
    subtype: 'В2',
    source: 'own',
    difficulty: 'base',
    units: 'rub',
    title: 'Два равных платежа: общая сумма в рублях',
    maxDecimals: 0,
    make({ plot }: { plot: PlotFull }) {
      const k = D(1).add(r.div(100));
      const x = S.mul(k.pow(2)).div(k.add(1));
      const answer = x.mul(2);
      if (!answer.isInteger()) return null;
      const X = equalPayment(S, 2, r);
      const rows = byPayments(S, [X, X], r);
      return {
        condition: `${frameJan(plot, `в банке на 2 года в размере ${money(D(par.S), 'thous')}`, r)}\nСколько рублей составит общая сумма платежей после полного погашения кредита, если известно, что кредит будет полностью погашен двумя равными платежами?`,
        answer,
        verify: totalPaid(rows),
        params: { S: S.toNumber(), r: r.toNumber() },
        rows,
        scheme: 'ann',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в рублях. Таблица — при найденном платеже.',
            undefined,
            true,
          ),
          step(
            'Составляем уравнение',
            `Обозначим $k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}$ и платёж $x$. Долг вырос в $k$ раз, уменьшился на $x$, снова вырос в $k$ раз и погашен вторым платежом.`,
            `(Sk - x)k - x = 0 \\quad\\Rightarrow\\quad Sk^2 = x(k + 1) \\quad\\Rightarrow\\quad x = \\dfrac{Sk^2}{k + 1}`,
          ),
          step(
            'Считаем',
            'Общая сумма — два одинаковых платежа.',
            `x = \\dfrac{${tex(S)}\\cdot ${tex(k.pow(2))}}{${tex(k.add(1))}} = ${tex(x)},\\qquad 2x = ${tex(answer)}`,
          ),
          step('Ответ', `Общая сумма платежей — ${money(answer, 'rub')}.`),
        ],
        vopros: 'rubli',
        hints: [
          hintType('C', 0),
          hintK(1),
          choice(
            'Какое уравнение описывает погашение кредита?',
            '$(Sk - x)k - x = 0$',
            ['$Sk^2 - 2x = 0$', '$S - 2x = 0$'],
            2,
            'Сначала долг растёт в $k$ раз, потом уменьшается на платёж — и так два года.',
          ),
        ],
      };
    },
  };
}

export interface DvaRavnyhStavka {
  /** Кредит и каждый из двух равных платежей, тыс. рублей. */
  S: DrobInput;
  x: DrobInput;
}

/**
 * Рамка «январь» с неизвестной ставкой r: кредит на 2 года погашен
 * двумя равными платежами x; найти r. Подвох — уравнение Sk² − xk − x = 0
 * квадратное относительно k, и берётся корень k > 1.
 */
export function dvaRavnyhStavka(par: DvaRavnyhStavka): Prototype {
  const S = D(par.S);
  const x = D(par.x);
  return {
    id: 'PV-C-DVA-STAVKA',
    type: 'C',
    subtype: 'В5',
    source: 'own',
    difficulty: 'base',
    units: 'percent',
    title: 'Два равных платежа: найти ставку',
    make({ plot }: { plot: PlotFull }) {
      /* Sk² − xk − x = 0: D = x² + 4Sx — полный квадрат. */
      const Dsk = x.mul(x).add(S.mul(x).mul(4));
      const kor = Math.round(Math.sqrt(Dsk.toNumber()) * 1e6) / 1e6;
      const koren = D(String(kor));
      if (!koren.mul(koren).eq(Dsk)) return null;
      const k = x.add(koren).div(S.mul(2));
      const r = k.sub(1).mul(100);
      if (!r.isInteger() || r.lt(1)) return null;
      /* Второй счёт: перебор целых ставок прямым пересчётом долга. */
      let found = D(0);
      for (let t = 1; t <= 100; t += 1) if (byPayments(S, [x, x], t)[1]!.end.eq(0)) found = D(t);
      const rows = byPayments(S, [x, x], r);
      const y = plot.year;
      return {
        condition: `${frameJan(plot, `в банке на 2 года в размере ${money(S, 'thous')}`, '$r$ %', [
          `к июлю ${y + 2} года кредит должен быть полностью погашен`,
        ]).replace(
          'необходимо выплатить одним платежом часть долга',
          'необходимо выплатить часть долга',
        )}\nНайдите $r$, если кредит будет полностью погашен двумя равными платежами по ${money(x, 'thous')}.`,
        answer: r,
        verify: found,
        params: { S: S.toNumber(), x: x.toNumber() },
        rows,
        scheme: 'ann',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в тыс. рублей. Таблица — при найденной ставке.',
            undefined,
            true,
          ),
          step(
            'Составляем уравнение',
            'Обозначим $k = 1 + \\dfrac{r}{100}$. Долг вырос в $k$ раз, уменьшился на платёж, снова вырос и погашен вторым платежом.',
            `(${tex(S)}k - ${tex(x)})k - ${tex(x)} = 0 \\quad\\Rightarrow\\quad ${tex(S)}k^2 - ${tex(x)}k - ${tex(x)} = 0`,
          ),
          step(
            'Решаем',
            'Подходит только корень $k > 1$.',
            `\\mathcal D = ${tex(x)}^2 + 4\\cdot ${tex(S)}\\cdot ${tex(x)} = ${tex(Dsk)} = ${tex(koren)}^2,\\quad k = \\dfrac{${tex(x)} + ${tex(koren)}}{2\\cdot ${tex(S)}} = ${tex(k)}`,
          ),
          step('Ответ', `$k = ${tex(k)}$, значит, $r = ${tex(r)}$.`),
        ],
        vopros: 'stavka',
        hints: [
          hintType('C', 0),
          hintK(1),
          choice(
            'Какое уравнение получится?',
            `$(${tex(S)}k - ${tex(x)})k - ${tex(x)} = 0$`,
            [`$${tex(S)}k^2 - 2\\cdot ${tex(x)} = 0$`, `$${tex(S)}k - 2\\cdot ${tex(x)} = 0$`],
            2,
            'Второй платёж вносят после второго начисления.',
          ),
        ],
      };
    },
  };
}

export interface VkladNachalnyy {
  /** Ежегодное пополнение, тыс. рублей. */
  x: number;
  r: DrobInput;
  /** Сумма на вкладе через три года, тыс. рублей. */
  Z: DrobInput;
}

/**
 * Январь: вклад на целое число S сотен тысяч рублей на 3 года; в
 * январе второго и третьего года — пополнения по x тыс. рублей; в
 * декабре — r %. Найти S по сумме Z через три года. Подвох — S в сотнях
 * тысяч, а уравнение — в тысячах: 100S·k³ + x(k² + k) = Z.
 */
export function vkladNachalnyy(par: VkladNachalnyy): Prototype {
  const x = D(par.x);
  const r = D(par.r);
  const Z = D(par.Z);
  return {
    id: 'PV-D-NACHALNYY',
    type: 'D',
    subtype: 'Г',
    source: 'own',
    difficulty: 'base',
    units: 'none',
    title: 'Вклад с двумя равными пополнениями: найти первоначальный вклад',
    plot: { kind: 'deposit' },
    make({ plot }: { plot: PlotFull }) {
      const k = D(1).add(r.div(100));
      const k3 = k.pow(3);
      const k2k = k.pow(2).add(k);
      const ost = Z.sub(x.mul(k2k));
      const S100 = ost.div(k3);
      const S = S100.div(100);
      if (!S.isInteger() || !S.isPositive()) return null;
      const rows = deposit(S100, 3, r, { after: [x, x, 0] });
      /* Второй счёт: перебор S прямым пересчётом вклада по годам. */
      let found = D(0);
      for (let t = 1; t <= 200; t += 1)
        if (deposit(t * 100, 3, r, { after: [x, x, 0] })[2]!.end.eq(Z)) found = D(t);
      const y = plot.year;
      return {
        condition:
          `В январе ${y} года ${plot.subject} ${v(plot, 'планирует', 'планирует')} открыть вклад${plot.goal.startsWith('чтобы') ? `, ${plot.goal},` : ` ${plot.goal}`} на 3 года на целое число $S$ сотен тысяч рублей, а в январе ${y + 1} и ${y + 2} годов дополнительно вносить на этот вклад ещё по ${money(x, 'thous')}. ` +
          `Банк в декабре каждого года действия вклада начисляет ${pct(r)} на сумму, находящуюся на вкладе. Начисленные проценты при этом остаются на вкладе, увеличивая сумму вклада.\nНайдите $S$, если в январе ${y + 3} года на вкладе должно быть ${money(Z, 'thous')}.`,
        answer: S,
        verify: found,
        params: { x: x.toNumber(), r: r.toNumber(), Z: Z.toNumber() },
        rows,
        scheme: 'dep',
        period: 'year',
        solution: [
          step(
            'Составляем таблицу',
            'Суммы — в тыс. рублей: вклад $S$ сотен тысяч — это $100S$ тыс. рублей. Таблица — при найденном $S$.',
            undefined,
            true,
          ),
          step(
            'Составляем уравнение',
            `Обозначим $k = 1 + \\dfrac{${tex(r)}}{100} = ${tex(k)}$. Первоначальный вклад вырос три раза, первое пополнение — два раза, второе — один раз.`,
            `100S\\cdot k^3 + ${tex(x)}k^2 + ${tex(x)}k = ${tex(Z)}`,
          ),
          step(
            'Считаем',
            `$k^3 = ${tex(k3)}$, $k^2 + k = ${tex(k2k)}$.`,
            `${tex(k3.mul(100))}S + ${tex(x.mul(k2k))} = ${tex(Z)} \\quad\\Rightarrow\\quad S = \\dfrac{${tex(ost)}}{${tex(k3.mul(100))}} = ${tex(S)}`,
          ),
          step('Ответ', `$S = ${tex(S)}$: первоначальный вклад — ${money(S100, 'thous')}.`),
        ],
        vopros: 'summa',
        hints: [
          hintType('D', 0),
          hintK(1),
          choice(
            'Какое уравнение получится (суммы в тыс. рублей)?',
            `$100S\\cdot k^3 + ${tex(x)}k^2 + ${tex(x)}k = ${tex(Z)}$`,
            [
              `$S\\cdot k^3 + ${tex(x)}k^2 + ${tex(x)}k = ${tex(Z)}$`,
              `$100S\\cdot k^3 + 2\\cdot ${tex(x)}k = ${tex(Z)}$`,
            ],
            2,
            'Вклад дан в сотнях тысяч, пополнения — в тысячах; первое пополнение лежит на счёте два начисления.',
          ),
        ],
      };
    },
  };
}
