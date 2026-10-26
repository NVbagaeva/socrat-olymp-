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
  7: () => import('./v07'),
  8: () => import('./v08'),
  9: () => import('./v09'),
  10: () => import('./v10'),
  11: () => import('./v11'),
  12: () => import('./v12'),
};

/** Номера вариантов, у которых есть версии (остальные — «скоро»). */
export const GOTOVY: readonly number[] = Object.keys(ZAGRUZKA).map(Number);

/**
 * Варианты, у которых готова часть 2 (задания 14–20). Экран раздела
 * читает список без загрузки данных; автотест сверяет его с данными.
 */
export const S_CHAST2: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export async function zagruzitVariant(k: number): Promise<VariantPV | null> {
  const f = ZAGRUZKA[k];
  return f === undefined ? null : (await f()).VARIANT;
}
