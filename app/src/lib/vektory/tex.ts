/**
 * Запись векторов в TeX для условий и разборов задания №2.
 *
 * Десятичные числа, дроби и ответ записываются теми же функциями,
 * что у задания №8 (lib/vychisleniya/tex, numbers): запятая — `{,}`,
 * минус — дефис. Здесь только то, чего там нет: вектор со стрелкой,
 * координаты, линейная комбинация, модуль и скалярное произведение.
 */

import { ru } from '../vychisleniya/numbers';
import { d } from '../vychisleniya/tex';
import type { Tochka } from './types';

export { d, ru };

/** $\vec{a}$ */
export function vec(name: string): string {
  return `\\vec{${name}}`;
}

/** Координаты в скобках: (6;\ -8). */
export function kv(x: number, y: number): string {
  return `(${d(x)};\\ ${d(y)})`;
}

/** $\vec{a}(6;\ -8)$ */
export function vecKv(name: string, p: Tochka): string {
  return `${vec(name)}${kv(p[0], p[1])}`;
}

/** Коэффициент перед вектором: 1 → «», -1 → «-», 0,6 → «0{,}6». */
function koef(k: number, first: boolean): string {
  const sign = k < 0 ? '-' : first ? '' : '+';
  const abs = Math.abs(k);
  return sign + (abs === 1 ? '' : d(abs));
}

/** Линейная комбинация: 8\vec{a}+\vec{b}, \vec{a}-2{,}7\vec{b}+0{,}4\vec{c}. */
export function kombinatsiya(terms: readonly (readonly [number, string])[]): string {
  return terms
    .filter(([k]) => k !== 0)
    .map(([k, name], i) => koef(k, i === 0) + vec(name))
    .join('');
}

/** |\vec{a}| или \left|\,8\vec{a}+\vec{b}\,\right|. */
export function modul(inner: string): string {
  return inner.includes('+') || inner.includes('-')
    ? `\\left|\\,${inner}\\,\\right|`
    : `\\left|${inner}\\right|`;
}

/** \vec{a}\cdot\vec{b} */
export function skalyarnoe(a: string, b: string): string {
  return `${a}\\cdot${b}`;
}

/** Число как слагаемое: 3 → «+3», -4 → «-4», первое без плюса. */
export function slagaemoe(x: number, first: boolean): string {
  if (first) {
    return d(x);
  }
  return x < 0 ? `-${d(-x)}` : `+${d(x)}`;
}

/** Множитель в произведении: отрицательный — в скобках. */
export function mnozhitel(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

/** k·x с записью «8\cdot 1», «-3\cdot(-2)»; k = 1 — просто x. */
export function proizvedenie(k: number, x: number): string {
  if (k === 1) {
    return mnozhitel(x);
  }
  if (k === -1) {
    return x < 0 ? `-(${d(x)})` : `-${d(x)}`;
  }
  return `${d(k)}\\cdot${mnozhitel(x)}`;
}

/** Квадрат числа: 6^2, (-8)^2. */
export function kvadrat(x: number): string {
  return x < 0 ? `(${d(x)})^2` : `${d(x)}^2`;
}

/** Градусы: 60^\circ. */
export function grad(x: number): string {
  return `${x}^\\circ`;
}

/** Длина с корнем: 2\sqrt{3}, \sqrt{2}, 7. */
export function koren(k: number, m: number): string {
  if (m === 1) {
    return String(k);
  }
  return `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
