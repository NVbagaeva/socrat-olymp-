/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №13.
 * В реестр PROTOTYPES не входят — в банк, тренажёр и генератор №13 не
 * попадают. Числа и сюжет задаёт вариант (`generateFixed`), решение и
 * подсказки — общими кирпичами типа A (дифференцированный платёж).
 */

import { D, type DrobInput } from '../drob';
import { v, type PlotFull } from '../plots';
import { difPereplata, type DifItog } from '../reshenie';
import { byDebts, deposit, differentiated, totalPaid } from '../solver';
import { frameJuly, money, pct, years } from '../text';
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
          `В январе ${y} года ${plot.subject} ${v(plot, 'открыл', 'открыла')} вклад ${plot.goal} и ${v(plot, 'положил', 'положила')} на него ${money(S, 'thous')}. ` +
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
    title: 'Долг каждый год меньше на q %: последний платёж в рублях',
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
