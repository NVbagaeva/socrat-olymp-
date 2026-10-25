/**
 * Готовые варианты раздела. Вариант грузится отдельным куском сборки:
 * экран раздела знает только номера (`GOTOVY`), числа подтягивает
 * сборка версии.
 */

import type { VariantPV } from '../types';

const ZAGRUZKA: Record<number, () => Promise<{ VARIANT: VariantPV }>> = {
  1: () => import('./v01'),
  2: () => import('./v02'),
  3: () => import('./v03'),
  4: () => import('./v04'),
  5: () => import('./v05'),
  6: () => import('./v06'),
};

/** Номера вариантов, у которых есть версии (остальные — «скоро»). */
export const GOTOVY: readonly number[] = Object.keys(ZAGRUZKA).map(Number);

export async function zagruzitVariant(k: number): Promise<VariantPV | null> {
  const f = ZAGRUZKA[k];
  return f === undefined ? null : (await f()).VARIANT;
}
