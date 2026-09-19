/**
 * Запись формул задания №8 в TeX.
 *
 * Все условия собираются отсюда: десятичная запятая — `{,}`, корни
 * произвольной степени, степени с дробными показателями, логарифмы,
 * углы в градусах и радианах. Модуль без зависимостей от KaTeX:
 * набор делает lib/tex.ts на сборке или в браузере.
 */

import { gcd, ru } from './numbers';

/** Десятичное число в TeX: 1{,}5, -3, 0{,}04. */
export function d(x: number): string {
  return ru(x).replace(',', '{,}');
}

/** Число в скобках, если оно отрицательное: (-3), иначе как есть. */
export function paren(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

/** Обыкновенная дробь num/den в TeX, сокращённая; целое — без дроби. */
export function frac(num: number, den: number, display = true): string {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  const n = num / g;
  const m = den / g;
  if (m === 1) {
    return String(n);
  }
  const cmd = display ? '\\dfrac' : '\\frac';
  return n < 0 ? `-${cmd}{${-n}}{${m}}` : `${cmd}{${n}}{${m}}`;
}

/** Дробь в показателе степени: без \dfrac, чтобы не раздувать строку. */
export function fracExp(num: number, den: number): string {
  return frac(num, den, false);
}

/** Степень: основание и показатель в фигурных скобках. */
export function pw(base: string, exp: string): string {
  return `${base}^{${exp}}`;
}

/** Корень степени n: при n = 2 — обычный. */
export function root(n: number, inner: string): string {
  return n === 2 ? `\\sqrt{${inner}}` : `\\sqrt[${n}]{${inner}}`;
}

/** Логарифм по основанию base от arg. */
export function log(base: string, arg: string): string {
  return `\\log_{${base}} ${arg}`;
}

/** Угол в градусах: 150^\circ; отрицательный — в скобках. */
export function deg(x: number, wrap = true): string {
  const s = `${x}^\\circ`;
  return x < 0 && wrap ? `(${s})` : s;
}

/** Угол в радианах: num·π/den в сокращённом виде. */
export function rad(num: number, den: number): string {
  const g = gcd(num, den);
  const n = num / g;
  const m = den / g;
  const top = n === 1 ? '\\pi' : n === -1 ? '-\\pi' : `${n}\\pi`;
  if (m === 1) {
    return top;
  }
  return n < 0 ? `-\\frac{${-n === 1 ? '' : -n}\\pi}{${m}}` : `\\frac{${n === 1 ? '' : n}\\pi}{${m}}`;
}

/** Открытый интервал четверти в радианах: \left(\pi; \frac{3\pi}{2}\right). */
export function quarterInterval(q: 1 | 2 | 3 | 4): string {
  const ends: Record<number, [string, string]> = {
    1: ['0', '\\frac{\\pi}{2}'],
    2: ['\\frac{\\pi}{2}', '\\pi'],
    3: ['\\pi', '\\frac{3\\pi}{2}'],
    4: ['\\frac{3\\pi}{2}', '2\\pi'],
  };
  const [a, b] = ends[q] as [string, string];
  return `\\left(${a}; ${b}\\right)`;
}

/** Тригонометрическая функция: \sin, \cos, \operatorname{tg}. */
export function fn(name: 'sin' | 'cos' | 'tg' | 'ctg'): string {
  return name === 'sin' || name === 'cos' ? `\\${name}` : `\\operatorname{${name}}`;
}

/** Коэффициент перед выражением: 1 — пусто, -1 — минус, иначе число. */
export function coef(c: number): string {
  if (c === 1) {
    return '';
  }
  if (c === -1) {
    return '-';
  }
  return d(c);
}

/** Коэффициент c·√r: 2\sqrt{3}, \sqrt{2}, 5. */
export function coefRoot(c: number, r: number): string {
  if (r === 1) {
    return coef(c) === '' ? '1' : d(c);
  }
  return `${coef(c)}\\sqrt{${r}}`;
}

/** Умножение с точкой. */
export const CDOT = ' \\cdot ';
