/**
 * Запись ответа: число с запятой, как в бланке ЕГЭ (минус — дефис).
 */

import { ru } from '../vychisleniya/numbers';

export function chislaOtvet(x: number): string {
  return ru(x);
}
