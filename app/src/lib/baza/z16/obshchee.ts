/**
 * База, задание №16: общие кирпичи разборов.
 *
 * Шаг разбора — как у профильного №8 (lib/vychisleniya, docs/zadanie-8-
 * razbory.md): заголовок говорит, что делаем, первая строка — почему
 * (свойство словами и формулой), вторая — выкладка, которая начинается
 * с того, что получилось на прошлом шаге. Последний шаг кончается
 * ответом.
 */

import type { Etap, HintStep } from '../types';
import type { Q } from './drob';

/** Итог разбора одной задачи: точный ответ, шаги, подсказки. */
export interface Resh {
  otvet: Q;
  etapy: Etap[];
  hints: HintStep[];
}

/** Вид записи: шаблон и разбор по найденным в нём числам. */
export interface Vid {
  re: RegExp;
  reshit(m: RegExpExecArray, zapis: string): Resh;
}

/** Шаг: заголовок, пояснение (может не быть) и выкладка TeX без долларов. */
export function etap(title: string, pochemu: string | null, ...vykladki: string[]): Etap {
  return {
    title,
    lines: [...(pochemu === null ? [] : [pochemu]), ...vykladki.map((v) => `$${v}$`)],
  };
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (типичные ошибки).
 * Повторы убираются, место верного зависит от sdvig — разное у разных
 * задач, но одно и то же при пересборке. Как в №5 (lib/baza/z05).
 */
export function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  const mesto = prochie.length === 0 ? 0 : Math.abs(sdvig) % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/** Число из записи «1,6» → TeX «1{,}6». */
export function d(s: string): string {
  return s.replace(',', '{,}').replace('−', '-');
}

/** Степень в TeX: отрицательное или дробное основание — в скобках. */
export function pw(osn: string | number, pok: string | number): string {
  const o = String(osn);
  if (o.startsWith('(') || o.startsWith('\\left(')) return `${o}^{${String(pok)}}`;
  const skobki = o.startsWith('-') || o.includes(',') || o.includes('\\') || o.includes(' ');
  return `${skobki ? `\\left(${d(o)}\\right)` : o}^{${String(pok)}}`;
}

/** Слагаемое показателя в сумме: отрицательное — в скобках. */
export function sk(x: number): string {
  return x < 0 ? `(${x})` : String(x);
}

/** Сумма показателей со знаками: «7 - 4 - (-1)». */
export function summaTex(chleny: readonly { znak: 1 | -1; e: number }[]): string {
  return chleny
    .map((c, i) => {
      if (i === 0) return c.znak === 1 ? String(c.e) : `-${sk(c.e)}`;
      return `${c.znak === 1 ? '+' : '-'} ${sk(c.e)}`;
    })
    .join(' ');
}

/** Хэш записи — сдвиг места верного ответа в подсказках. */
export function hesh(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 1000003;
  return h;
}

/** Вариант подсказки формулой. */
export const f = (t: string): string => `$${t}$`;

export const num = (s: string | undefined): number => {
  if (s === undefined) throw new Error('нет числа в записи');
  return Number(s);
};
