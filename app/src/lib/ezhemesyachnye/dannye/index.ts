/**
 * Варианты раздела. Каждый грузится отдельным куском сборки: экран
 * знает только номера, числа подтягивает сборка варианта.
 */

import type { VariantEV } from '../types';

const ZAGRUZKA: Record<number, () => Promise<{ VARIANT: VariantEV }>> = {
  1: () => import('./m01'),
  2: () => import('./m02'),
  3: () => import('./m03'),
  4: () => import('./m04'),
};

export const GOTOVY: readonly number[] = Object.keys(ZAGRUZKA).map(Number);

export async function zagruzitVariant(k: number): Promise<VariantEV | null> {
  const f = ZAGRUZKA[k];
  return f === undefined ? null : (await f()).VARIANT;
}
