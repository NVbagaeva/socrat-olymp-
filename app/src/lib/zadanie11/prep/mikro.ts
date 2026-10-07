/**
 * Генераторы микрозадач опорных блоков №11. Числа подбираются так,
 * чтобы ответы были «хорошими»; у выбора — три-четыре варианта с
 * типичными ошибками.
 */

import { chtoSprashivayut, dvizhenie, kvadrat, koncentraciya, rabota, vopros, xxd } from '../kit';
import { d, fq, frac, gcd, q, round9, val } from '../num';
import { vremya } from '../sklonenie';
import type { HintStep } from '../types';
import type { Rng } from '../gen/types';
import type { MikroVybor, MikroZadacha } from './types';

export { chtoSprashivayut };

/** Целое ли (с допуском). */
export function cel(x: number): boolean {
  return Math.abs(x - Math.round(x)) < 1e-9;
}

/** Конечная десятичная дробь не длиннее `places` знаков. */
export function des(x: number, places = 2): boolean {
  return cel(x * 10 ** places);
}

export function shag(r: Rng, a: number, b: number, step: number): number {
  return a + step * r.int(0, Math.floor((b - a) / step));
}

/**
 * Варианты выбора: верный и неверные, перемешаны детерминированно
 * (тем же правилом, что кнопки подсказок). Возвращает варианты и
 * номер верного.
 */
export function vybor(
  right: string,
  wrong: string[],
): { vybory: MikroVybor[]; otvet: string } | null {
  const h = vopros('выбор', right, wrong);
  if (h.options.length < 3) {
    return null;
  }
  return {
    vybory: h.options.map((label, i) => ({ number: String(i + 1), label })),
    otvet: String(h.correct + 1),
  };
}

/** Микрозадача с числовым ответом. */
export function chislo(
  uslovie: string,
  otvet: number,
  hints: HintStep[],
  razbor: string[],
  extra: Partial<MikroZadacha> = {},
): MikroZadacha {
  return { uslovie, answerType: 'number', otvet: round9(otvet), hints, razbor, ...extra };
}

/** Микрозадача с выбором. */
export function vyborZadacha(
  uslovie: string,
  right: string,
  wrong: string[],
  hints: HintStep[],
  razbor: string[],
  extra: Partial<MikroZadacha> = {},
): MikroZadacha | null {
  const v = vybor(right, wrong);
  if (!v) {
    return null;
  }
  return {
    uslovie,
    answerType: 'choice',
    otvet: v.otvet,
    vybory: v.vybory,
    hints,
    razbor,
    ...extra,
  };
}

export const otv = (x: number | string): string =>
  `**Ответ:** ${typeof x === 'number' ? `$${d(x)}$` : x}.`;

export {
  d,
  fq,
  frac,
  gcd,
  q,
  round9,
  val,
  vremya,
  dvizhenie,
  koncentraciya,
  rabota,
  kvadrat,
  xxd,
  vopros,
};
