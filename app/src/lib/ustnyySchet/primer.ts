/**
 * Сборка примера: ответ считается из выражения точной арифметикой
 * (chislo.ts), запись для экрана — из того же выражения.
 */

import { str, tex as texOf, text as textOf, vychislit } from './chislo';
import type { Deystvie, Primer, PriyomId, Uroven } from './types';

export interface PrimerSpec {
  priyom: PriyomId;
  uroven: Uroven;
  deystvie: Deystvie;
  d: readonly (string | number)[];
  v?: string;
  expr: string;
  /** Своя запись вопроса, если выражение для проверки пишется иначе («15 % от 360»). */
  tex?: string;
  text?: string;
  /** Свой ключ «без повторов»; по умолчанию — выражение. */
  key?: string;
  ed?: '%';
}

export function sdelat(s: PrimerSpec): Primer {
  const otvet = str(vychislit(s.expr));
  return {
    key: s.key ?? `${s.priyom}|${s.expr}`,
    priyom: s.priyom,
    uroven: s.uroven,
    deystvie: s.deystvie,
    d: s.d.map(String),
    ...(s.v === undefined ? {} : { v: s.v }),
    expr: s.expr,
    tex: s.tex ?? texOf(s.expr),
    text: s.text ?? textOf(s.expr),
    otvet,
    ...(s.ed === undefined ? {} : { ed: s.ed }),
  };
}

/** Значение выражения нормальной записью: «7225». */
export function znach(expr: string): string {
  return str(vychislit(expr));
}

/** Ключ для перестановочных действий: множители по порядку. */
export function klyuchPerestanovki(
  priyom: PriyomId,
  op: string,
  nums: readonly (string | number)[],
): string {
  return `${priyom}|${op}|${nums.map(String).sort().join(',')}`;
}

/** Число в выражении: отрицательное — в скобках. */
export function sk(x: string | number): string {
  const s = String(x);
  return s.startsWith('-') ? `(${s})` : s;
}

/** Цифры числа (целого, неотрицательного). */
export function cifry(n: number): number[] {
  return String(n).split('').map(Number);
}

/** Десятичная запись числа n / 10^k без плавающей точки: (25, 2) → «0.25». */
export function drob(n: number, k: number): string {
  const neg = n < 0;
  const s = String(Math.abs(n)).padStart(k + 1, '0');
  const whole = s.slice(0, s.length - k);
  let frac = k === 0 ? '' : s.slice(s.length - k);
  frac = frac.replace(/0+$/, '');
  const body = frac === '' ? whole : `${whole}.${frac}`;
  return neg && body !== '0' ? `-${body}` : body;
}
