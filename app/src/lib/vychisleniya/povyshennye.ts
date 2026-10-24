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
/** Конечная ли десятичная дробь (до 4 знаков): 1/(−3) — нет, его оставляем дробью. */
const konechnaya = (x: number) => Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9;

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
      `Основания разные: дано $${log('b', 'a')}$, а нужен $${log('a', 'b')}$. Они взаимно обратны: $${log('a', 'b')} = \\dfrac{1}{${log('b', 'a')}} = \\dfrac{1}{${d(t)}}${Number.isInteger(obr) || !konechnaya(obr) ? '' : ` = ${d(round9(obr))}`}$.`,
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

/**
 * log_a(aᵐ·√b), если log_b a = t: степень основания даёт m, а корень из
 * b — половину log_a b = 1/t. Подвох — «перевернуть» логарифм.
 */
export function logPryamoy(p: { m: number; t: number }): Draft {
  const { m, t } = p;
  const obr = round9(1 / t);
  const pol = round9(obr / 2);
  const otvet = round9(m + pol);
  const arg = `a^{${m}}\\cdot\\sqrt{b}`;
  return {
    uslovie: `Найдите $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      `Логарифм произведения — сумма логарифмов: $${log('a', `\\left(${arg}\\right)`)} = ${log('a', `a^{${m}}`)} + ${log('a', '\\sqrt{b}')}$.`,
      `$${log('a', `a^{${m}}`)} = ${m}$ — показатель степени основания.`,
      `Дано $${log('b', 'a')}$, а нужен $${log('a', 'b')}$: они взаимно обратны, $${log('a', 'b')} = \\dfrac{1}{${d(t)}} = ${d(obr)}$.`,
      `Корень — степень $\\dfrac12$: $${log('a', '\\sqrt{b}')} = \\dfrac12\\cdot${log('a', 'b')} = \\dfrac12\\cdot(${d(obr)}) = ${d(pol)}$.`,
      `Складываем: $${m} + (${d(pol)}) = ${d(otvet)}$.`,
    ],
    params: { m, t },
    proverka: (() => {
      const b = 3;
      const a = b ** t;
      return Math.log(a ** m * Math.sqrt(b)) / Math.log(a);
    })(),
    signature: `pryam:${m}:${t}`,
  };
}

/**
 * 2c·sin x·cos x / sin(360° − 2x): числитель — c·sin 2x, знаменатель
 * по формуле приведения −sin 2x. Подвох — знак: ответ −c.
 */
export function sinDvoynogoPrivedenie(p: { x: number; c: number }): Draft {
  const { x, c } = p;
  const y = 360 - 2 * x;
  const vnizu = `\\sin ${y}^\\circ`;
  const svyaz = `$\\sin ${y}^\\circ = \\sin(360^\\circ - ${2 * x}^\\circ) = -\\sin ${2 * x}^\\circ$ — синус меняет знак при вычитании из $360^\\circ$.`;
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${2 * c}\\sin ${x}^\\circ\\cdot\\cos ${x}^\\circ}{${vnizu}}$.`,
    otvet: -c,
    razbor: [
      `Числитель — синус двойного угла: $${2 * c}\\sin ${x}^\\circ\\cos ${x}^\\circ = ${c}\\cdot 2\\sin ${x}^\\circ\\cos ${x}^\\circ = ${c}\\sin ${2 * x}^\\circ$.`,
      svyaz,
      `Делим: $\\dfrac{${c}\\sin ${2 * x}^\\circ}{-\\sin ${2 * x}^\\circ} = ${d(-c)}$.`,
    ],
    params: { x, c },
    proverka: (() => {
      const r = Math.PI / 180;
      return (2 * c * Math.sin(x * r) * Math.cos(x * r)) / Math.sin(y * r);
    })(),
    signature: `sin2:${x}:${c}`,
  };
}

/**
 * (b^s1)^x / (b^s2)^y: оба основания — степени b, показатели дробные,
 * разность целая. Ответ b^(s1·x − s2·y).
 */
export function stepeniChastnoe(p: {
  b: number;
  s1: number;
  s2: number;
  x: number;
  y: number;
}): Draft {
  const { b, s1, s2, x, y } = p;
  const B1 = b ** s1;
  const B2 = b ** s2;
  const e1 = round9(s1 * x);
  const e2 = round9(s2 * y);
  const e = round9(e1 - e2);
  const otvet = round9(b ** e);
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${B1}^{${d(x)}}}{${B2}^{${d(y)}}}$.`,
    otvet,
    razbor: [
      `Оба основания — степени числа $${b}$: $${B1} = ${b}^{${s1}}$, $${B2} = ${b}^{${s2}}$.`,
      `Степень в степени — показатели перемножаются: $${B1}^{${d(x)}} = ${b}^{${s1}\\cdot${d(x)}} = ${b}^{${d(e1)}}$, $${B2}^{${d(y)}} = ${b}^{${s2}\\cdot${d(y)}} = ${b}^{${d(e2)}}$.`,
      `При делении степеней показатели вычитаются: $${b}^{${d(e1)}-${d(e2)}} = ${b}^{${d(e)}} = ${d(otvet)}$.`,
    ],
    params: { b, s1, s2, x, y },
    proverka: B1 ** x / B2 ** y,
    signature: `stch:${b}:${s1}:${s2}:${x}:${y}`,
  };
}
