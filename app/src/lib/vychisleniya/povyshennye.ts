/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №8.
 *
 * Черновик того же вида, что у подтипов раздела (types.ts, `Draft`):
 * условие, ответ, строки разбора с формулами и второй, численный счёт.
 * Лист учителя (`razborStepsHtml`) собирает его как задачу банка.
 * В банк, тренажёр и генератор №8 не входит.
 */

import { d, log } from './tex';
import type { Draft } from './types';

const round9 = (x: number) => Math.round(x * 1e9) / 1e9;

/**
 * log_a(bᵐ·√a), если log_b a = t: сначала перевернуть логарифм
 * (log_a b = 1/t), затем разложить логарифм произведения.
 */
export function logObratnyy(p: { m: number; t: number }): Draft {
  const { m, t } = p;
  const obr = 1 / t;
  const chast = round9(m * obr);
  const otvet = round9(chast + 0.5);
  const arg = `b^{${m}}\\cdot\\sqrt{a}`;
  return {
    uslovie: `Найдите значение выражения $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      `Основания разные: дано $${log('b', 'a')}$, а нужен $${log('a', 'b')}$. Они взаимно обратны: $${log('a', 'b')} = \\dfrac{1}{${log('b', 'a')}} = \\dfrac{1}{${d(t)}}${Number.isInteger(obr) ? '' : ` = ${d(round9(obr))}`}$.`,
      `Логарифм произведения — сумма логарифмов: $${log('a', `\\left(${arg}\\right)`)} = ${log('a', `b^{${m}}`)} + ${log('a', '\\sqrt{a}')}$.`,
      `Показатель выносим множителем: $${log('a', `b^{${m}}`)} = ${m}\\cdot${log('a', 'b')} = ${m}\\cdot\\dfrac{1}{${d(t)}} = ${d(chast)}$.`,
      `Корень — степень $\\dfrac12$: $${log('a', '\\sqrt{a}')} = ${log('a', 'a^{\\frac12}')} = \\dfrac12 = 0{,}5$.`,
      `Складываем: $${d(chast)} + 0{,}5 = ${d(otvet)}$.`,
    ],
    params: { m, t },
    /* Второй счёт: подставляем конкретные a и b с log_b a = t. */
    proverka: (() => {
      const b = 3;
      const a = b ** t;
      return Math.log(b ** m * Math.sqrt(a)) / Math.log(a);
    })(),
    signature: `inv:${m}:${t}`,
  };
}
