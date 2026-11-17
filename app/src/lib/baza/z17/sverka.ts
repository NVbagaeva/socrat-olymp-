/**
 * База №17: сверка уравнений теории перебором — независимо от текста
 * разбора. Тождество (подходит любое число) узнаётся точной
 * подстановкой нескольких чисел, корни ищет перебор proverka.ts.
 * Берут pnpm test:baza (примеры теории и «Проверь себя»).
 */

import { q, zapisQ } from './drobi';
import { koren, korni } from './proverka';
import { razobrat } from './razbor';

export type ItogSverki = readonly string[] | 'net' | 'lyuboe';

/** Все корни уравнения записью бланка (минус — «−»), «net» или «lyuboe». */
export function sverit(zapis: string): ItogSverki {
  const ur = razobrat(zapis);
  const proby = [q(0), q(1), q(-2), q(7, 3), q(-13, 5), q(41)];
  if (proby.every((x) => koren(ur, x))) return 'lyuboe';
  const k = korni(ur);
  return k.length === 0 ? 'net' : k.map(zapisQ);
}

/** Запись бланка без разницы в минусе: «-2,5» и «−2,5» — одно число. */
export const normMinus = (s: string): string => s.replace(/-/g, '−');
