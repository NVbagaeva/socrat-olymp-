/**
 * Реестр живых чертежей ключевых схем №18: id схемы → сцена движка
 * lib/skhemy. Тексты схем — content/zadanie18/.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { VYSOTY } from './vysoty';

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = {
  vysoty: VYSOTY,
};

export function zhivayaSkhema18(id: string): ZhivayaSkhema | undefined {
  return REESTR[id];
}

/** То же, но схема обязана быть: страницы строятся только для собранных. */
export function trebuetsyaSkhema18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет живого чертежа схемы ${id}`);
  return s;
}
