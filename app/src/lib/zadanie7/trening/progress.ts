'use client';

/**
 * Хранилища тренажёра №7: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), как у №8 и №3: из него считаются
 * прогресс по группам, «Стоит повторить», «Мои ошибки» и число решённых
 * задач банка. Тип попытки (kind) — прототип банка («P18»). Прежний
 * ключ budetege:zadanie-7:v1 (счётчики по прототипам и список ошибок,
 * lib/zadanie7/progress.ts) сворачивается в журнал при первом чтении
 * (LEGACY_LOGS) и сам остаётся на месте.
 *
 * Оба хранилища — synced (lib/syncedStore): у гостя они живут только в
 * браузере, со входом — ещё и в аккаунте и сливаются между
 * устройствами. Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createSyncedStore } from '@/lib/syncedStore';
import type { Istochnik7 } from './session';

export const PROGRESS7_KEY = 'budetege:zadanie-7:log:v1';
export const log7 = createLogStore(PROGRESS7_KEY);

export interface Vybor7 {
  /** Выбранные прототипы. Пусто — все. */
  tipy: string[];
  /** Сколько задач; null — без конца. */
  count: number | null;
  timer: boolean;
  /** Без подсказок и решений до итогов. */
  bezPodskazok: boolean;
  istochnik: Istochnik7;
}

export const VYBOR7_DEFAULT: Vybor7 = {
  tipy: [],
  count: 10,
  timer: true,
  bezPodskazok: false,
  istochnik: 'vse',
};

export function parseVybor7(value: unknown): Vybor7 {
  if (typeof value !== 'object' || value === null) {
    return VYBOR7_DEFAULT;
  }
  const v = value as Partial<Vybor7>;
  return {
    tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
    count: v.count === null ? null : typeof v.count === 'number' && v.count > 0 ? v.count : 10,
    timer: v.timer !== false,
    bezPodskazok: v.bezPodskazok === true,
    istochnik: v.istochnik === 'fipi' || v.istochnik === 'new' ? v.istochnik : 'vse',
  };
}

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR7_KEY = 'budetege:zadanie-7:vybor:v1';
export const vybor7 = createSyncedStore<Vybor7>(VYBOR7_KEY, parseVybor7, VYBOR7_DEFAULT);
