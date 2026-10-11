/**
 * Формулировки условий задания №9 в стиле ФИПИ: на рисунке изображён
 * график …, отмечены точки …, найдите … Все формулы — в $…$ для KaTeX.
 */

import { interval, otrezok, perechenX } from './tex';

const SLOVA = [
  'ноль',
  'одна',
  'две',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
  'десять',
];

/** «отмечены четыре точки» / «отмечено пять точек». */
export function otmecheno(n: number): string {
  const word = SLOVA[n] ?? String(n);
  if (n >= 2 && n <= 4) {
    return `отмечены ${word} точки`;
  }
  return `отмечено ${word} точек`;
}

/** «На оси абсцисс отмечено семь точек: $x_1,\ x_2,\ \ldots,\ x_7$.» */
export function metkiTekst(n: number): string {
  return `На оси абсцисс ${otmecheno(n)}: $${perechenX(n)}$.`;
}

export function grafikF(a: number, b: number): string {
  return `На рисунке изображён график функции $y=f(x)$, определённой на интервале $${interval(a, b)}$.`;
}

export function grafikP(a: number, b: number): string {
  return `На рисунке изображён график $y=f'(x)$ — производной функции $f(x)$, определённой на интервале $${interval(a, b)}$.`;
}

export function grafikBigF(a: number, b: number): string {
  return `На рисунке изображён график $y=F(x)$ — одной из первообразных функции $f(x)$, определённой на интервале $${interval(a, b)}$.`;
}

export { interval, otrezok };

/** Прямая y = kx + m в TeX. */
export function pryamaya(k: number, m: number): string {
  const kk = k === 1 ? '' : k === -1 ? '-' : String(k);
  const mm = m === 0 ? '' : m > 0 ? `+${m}` : String(m);
  return `y=${kk}x${mm}`;
}
