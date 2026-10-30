/**
 * Набор раздела по коду — тяжёлая часть (движки разделов): вариант как
 * `VariantSet` и его часть 2. Лёгкие подписи и адреса — в razdely.ts.
 */

import type { VariantSet } from '@/lib/variant/types';
import type { Chast2Zadacha } from './chast2/types';
import type { NaborRazdela } from './razdely';

export async function naborSet(n: NaborRazdela): Promise<VariantSet | null> {
  if (n.razdel === 'ev') {
    const { ezhSet } = await import('@/lib/ezhemesyachnye/set');
    return ezhSet(n.k);
  }
  const { povSet } = await import('./set');
  return povSet(n.k);
}

/** Задачи 14–20 версии v; null — части 2 нет. */
export async function naborChast2(n: NaborRazdela, v: number): Promise<Chast2Zadacha[] | null> {
  if (n.razdel === 'ev') {
    const { chast2EV } = await import('@/lib/ezhemesyachnye/chast2');
    return v === 1 ? chast2EV(n.k) : null;
  }
  const { chast2Versii } = await import('./chast2');
  return chast2Versii(n.k, v);
}
