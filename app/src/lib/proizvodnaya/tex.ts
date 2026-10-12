/**
 * Запись формул задания №9 в TeX: интервалы, отрезки, отмеченные точки,
 * производная. Числа — теми же функциями, что у заданий №2 и №8:
 * запятая — `{,}`, минус — дефис.
 */

import { ru } from '../vychisleniya/numbers';
import { d } from '../vychisleniya/tex';

export { d, ru };

/** Интервал: $(-6;\ 8)$ без долларов. */
export function interval(a: number, b: number): string {
  return `(${d(a)};\\ ${d(b)})`;
}

/** Отрезок: $[-2;\ 4]$ без долларов. */
export function otrezok(p: number, q: number): string {
  return `[${d(p)};\\ ${d(q)}]`;
}

/** x_i. */
export function xi(i: number): string {
  return `x_{${i}}`;
}

/** x_1,\ x_2,\ \ldots,\ x_n; для n ≤ 4 — перечислением. */
export function perechenX(n: number): string {
  if (n <= 4) {
    return Array.from({ length: n }, (_, i) => xi(i + 1)).join(',\\ ');
  }
  return `${xi(1)},\\ ${xi(2)},\\ \\ldots,\\ ${xi(n)}`;
}

/** Производная в точке: f'(x_0). */
export function fp(arg: string, name = 'f'): string {
  return `${name}'(${arg})`;
}

/** Минус для чисел в тексте разбора: типографский через TeX не нужен. */
export function znakChisla(x: number): string {
  return x > 0 ? '+' : x < 0 ? '-' : '0';
}
