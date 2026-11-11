import { round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
import type { Rng } from '../../rng';
import { d } from '../../tex';
import type { Shag } from '../../types';
import type { PrepChoice, PrepGenerated, PrepMicro } from '../types';

export const ZNAK: PrepChoice[] = [
  { number: '1', label: 'плюс' },
  { number: '2', label: 'минус' },
];

export function micro(
  id: string,
  nazvanie: string,
  formula: string,
  generate: (r: Rng) => PrepGenerated | null,
  choices?: PrepChoice[],
): PrepMicro {
  return choices === undefined
    ? { id, nazvanie, formula, answerType: 'number', generate }
    : { id, nazvanie, formula, answerType: 'choice', choices, generate };
}

export function naydi(tex: string): string {
  return `Найдите значение выражения $${tex}$.`;
}

/** Наименьшая степень десяти, кратная знаменателю: 8 → 1000. null — такой нет. */
function desyatok(den: number): number | null {
  for (let p = 1; p <= 1e6; p *= 10) {
    if (p % den === 0) {
      return p;
    }
  }
  return null;
}

/**
 * Обыкновенная дробь num/den (уже сокращённая) — в десятичную: если
 * знаменатель не степень десяти, домножаем его до 10, 100 или 1000.
 * `prefix` — выкладка до дроби: «2^{-3} = \dfrac{1}{2^{3}} = »; она
 * кончается дробью \dfrac{num}{den}. Знаменатель 1 и 2 — без второго
 * шага, их переводят в уме.
 */
export function vDesyatichnuyu(chto: string, prefix: string, num: number, den: number): Shag[] {
  const value = round9(num / den);
  if (den === 1) {
    return [shag(chto, `${prefix}${num}`)];
  }
  const p = desyatok(den);
  if (den === 2 || p === null || p === den) {
    return [shag(chto, `${prefix}\\dfrac{${num}}{${den}} = ${d(value)}`)];
  }
  const m = p / den;
  return [
    shag(chto, `${prefix}\\dfrac{${num}}{${den}}`),
    shag(
      `Переводим в десятичную дробь: домножаем числитель и знаменатель на $${m}$, чтобы в знаменателе получилось $${p}$`,
      `\\dfrac{${num}}{${den}} = \\dfrac{${num * m}}{${p}} = ${d(value)}`,
    ),
  ];
}
