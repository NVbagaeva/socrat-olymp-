'use client';

/**
 * Личная статистика устного счёта в браузере (и в аккаунте — через
 * общую синхронизацию: ключ в lib/progressImport/registry.ts).
 */

import { createSyncedStore } from '@/lib/syncedStore';
import {
  parseStat,
  PUSTO,
  USTNYY_KEY,
  zapisat,
  type Itog,
  type Stat,
  type Zapisano,
} from './model';

export const ustnyyStat = createSyncedStore<Stat>(USTNYY_KEY, parseStat, PUSTO);

export function zapisatTrenirovku(it: Itog): Zapisano {
  const res = zapisat(ustnyyStat.get(), it);
  if (res.stat !== ustnyyStat.get()) ustnyyStat.set(res.stat);
  return res;
}
