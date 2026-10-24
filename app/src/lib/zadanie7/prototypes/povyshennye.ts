/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №7.
 * В общий реестр PROTOTYPES не входят — в банк, тренажёр и генератор
 * №7 не попадают. Устроены как прототипы группы III: разбор по тем же
 * этапам (`razbor`), подсказки — `hint`, проверка — подстановкой.
 */

import { d, hint, lin, mul, num, pw, q, razbor, sub, t, uslovieTekst, val } from '../kit';
import type { Params, Prototype } from '../types';
import { ryadom } from './gruppa1';

/** Показатель основания по a: 9 при a = 3 → 2. */
function stepen(c: number, a: number): number {
  let s = 0;
  let m = c;
  while (m > 1) {
    if (m % a !== 0) throw new Error(`${c} — не степень ${a}`);
    m /= a;
    s += 1;
  }
  return s;
}

function uravnenie(p: Params): string {
  const c = num(p, 'c');
  const a = num(p, 'a');
  const b = num(p, 'b');
  const m = num(p, 'm');
  return `${pw(d(c), lin(-1, b, 'x', 'bx'))}=\\sqrt{${d(a ** m)}}`;
}

/**
 * c^(b − x) = √(aᵐ), где c = aˢ, m нечётное: справа корень, который
 * не извлекается нацело, — его надо записать степенью a^(m/2).
 */
export const PV7_KOREN: Prototype = {
  id: 'PV7-KOREN',
  no: 101,
  group: 'III',
  title: 'Степень равна корню: показатель-дробь',
  formula: '\\left(a^s\\right)^{b-x}=\\sqrt{a^m}',
  skills: ['stepeni', 'korni', 'perenos'],
  fipiNos: '',
  uravnenie,
  uslovie(p) {
    return uslovieTekst(uravnenie(p), 'koren');
  },
  vopros: () => 'koren',
  chisla(p) {
    const c = num(p, 'c');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const m = num(p, 'm');
    return { lhs: (x) => c ** (b - x), rhs: () => Math.sqrt(a ** m), odz: () => true };
  },
  solve(p) {
    const c = num(p, 'c');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const m = num(p, 'm');
    const s = stepen(c, a);
    const pravyy = q(m, 2);
    /* s(b − x) = m/2  ⇒  x = b − m/(2s). */
    const x = sub(q(b), q(m, 2 * s));
    const ans = val(x);
    const E = lin(-1, b, 'x', 'bx');
    const levyy = `${d(s)}(${E})`;
    return {
      answer: ans,
      uravnenie: uravnenie(p),
      korni: [ans],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Показательное уравнение. План: записать обе части степенями одного основания и приравнять показатели. Корень справа — тоже степень, только с дробным показателем.',
        ],
        preobr: [
          `Основание слева: $${d(c)}=${pw(d(a), String(s))}$, поэтому $${pw(d(c), E)}=${pw(d(a), levyy)}$ (при возведении степени в степень показатели перемножаются).`,
          `Правая часть: $${d(a ** m)}=${pw(d(a), String(m))}$, а корень — степень с показателем $\\dfrac12$: $\\sqrt{${pw(d(a), String(m))}}=${pw(d(a), `\\frac{${m}}{2}`)}$.`,
          `Основания равны — приравниваем показатели: $${levyy}=\\dfrac{${m}}{2}$.`,
          `Делим на $${d(s)}$: $${E}=${t(q(m, 2 * s))}$.`,
          `Переносим: $x=${d(b)}-${t(q(m, 2 * s))}=${t(x)}$.`,
        ],
        korni: [`$x=${t(x)}$ — единственный корень (показательная функция монотонна).`],
        proverka: [
          `При $x=${t(x)}$ показатель слева $${d(b)}-${t(x)}=${t(sub(q(b), x))}$, левая часть $${pw(d(a), `${d(s)}\\cdot${t(sub(q(b), x))}`)}=${pw(d(a), t(mul(q(s), sub(q(b), x))))}$; правая часть $${pw(d(a), t(pravyy))}$ — равны.`,
        ],
        answer: ans,
      }),
      vychisleniya: [],
      hints: [
        hint(
          'К какому основанию привести обе части?',
          `$${d(a)}$`,
          [`$${d(c)}$`, `$${d(a ** m)}$`, '$10$'],
          `И $${d(c)}$, и $${d(a ** m)}$ — степени числа $${d(a)}$.`,
        ),
        hint(
          `Как записать $\\sqrt{${d(a ** m)}}$ степенью числа $${d(a)}$?`,
          `$${pw(d(a), `\\frac{${m}}{2}`)}$`,
          [
            `$${pw(d(a), String(m))}$`,
            `$${pw(d(a), String(2 * m))}$`,
            `$${pw(d(a), `\\frac{1}{${m}}`)}$`,
          ],
          'Корень квадратный — это степень $\\dfrac12$: $\\sqrt{a^m}=a^{\\frac{m}{2}}$.',
        ),
        hint(
          'Какое уравнение для показателей получится?',
          `$${levyy}=\\dfrac{${m}}{2}$`,
          [`$${E}=\\dfrac{${m}}{2}$`, `$${levyy}=${m}$`],
          `Слева показатель умножается на $${d(s)}$: $${d(c)}=${pw(d(a), String(s))}$.`,
        ),
        hint('Чему равен $x$?', `$${t(x)}$`, ryadom(x)),
      ],
    };
  },
};
