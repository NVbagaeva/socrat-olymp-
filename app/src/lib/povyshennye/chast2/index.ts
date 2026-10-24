/**
 * Часть 2 вариантов раздела по номеру варианта и версии. Данные
 * подгружаются отдельным куском: экран раздела и печать части 1 их не
 * тянут.
 */

import type { Chast2Zadacha } from './types';

type Modul = Record<number, Chast2Zadacha[]>;

const GOTOVY: Readonly<Record<number, () => Promise<Modul>>> = {
  1: () => import('./v01').then((m) => m.CHAST2_V01),
};

/** Задачи 14–20 версии `k.v`; null — часть 2 этой версии ещё не готова. */
export async function chast2Versii(k: number, v: number): Promise<Chast2Zadacha[] | null> {
  const load = GOTOVY[k];
  if (load === undefined) return null;
  const list = (await load())[v];
  return list === undefined || list.length === 0 ? null : list;
}

/** Готова ли часть 2 хотя бы у одной версии варианта (для карточки раздела). */
export function estChast2(k: number): boolean {
  return GOTOVY[k] !== undefined;
}
