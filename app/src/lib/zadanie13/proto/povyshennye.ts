/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №13.
 * В реестр PROTOTYPES не входят — в банк, тренажёр и генератор №13 не
 * попадают. Числа и сюжет задаёт вариант (`generateFixed`), решение и
 * подсказки — общими кирпичами типа A (дифференцированный платёж).
 */

import { D, type DrobInput } from '../drob';
import { v, type PlotFull } from '../plots';
import { difPereplata, type DifItog } from '../reshenie';
import { differentiated, totalPaid } from '../solver';
import { frameJuly, money } from '../text';
import { choice, hintChangeSum, hintOverpayFormula, hintType, step, tex } from './common';
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
