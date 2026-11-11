'use client';

/**
 * Хранилища тренажёра №3: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), как у №8: из него считаются
 * прогресс по группам, «Стоит повторить», «Мои ошибки» и число решённых
 * задач банка. Тип попытки (kind) — прототип банка («P03-01»): тот же
 * код, что в каталоге кабинета («3:P03-01»). Прежний ключ
 * budetege:z3:trainer:v1 (счётчики по прототипам и список ошибок)
 * сворачивается в журнал при первом чтении (LEGACY_LOGS).
 *
 * Оба хранилища — synced (lib/syncedStore): со входом их содержимое
 * живёт в аккаунте и сливается между устройствами. Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createSyncedStore } from '@/lib/syncedStore';
import type { Istochnik3 } from './session';

export const PROGRESS3_KEY = 'budetege:zadanie-3:log:v1';
export const log3 = createLogStore(PROGRESS3_KEY);

export interface Vybor3 {
  /** Выбранные типы. Пусто — все. */
  tipy: string[];
  /** Сколько задач; null — без конца. */
  count: number | null;
  timer: boolean;
  /** Без подсказок и решений до итогов. */
  bezPodskazok: boolean;
  istochnik: Istochnik3;
}

export const VYBOR3_DEFAULT: Vybor3 = {
  tipy: [],
  count: 10,
  timer: true,
  bezPodskazok: false,
  istochnik: 'vse',
};

function parseVybor(value: unknown): Vybor3 {
  if (typeof value !== 'object' || value === null) {
    return VYBOR3_DEFAULT;
  }
  const v = value as Partial<Vybor3>;
  return {
    tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
    count: v.count === null ? null : typeof v.count === 'number' && v.count > 0 ? v.count : 10,
    timer: v.timer !== false,
    bezPodskazok: v.bezPodskazok === true,
    istochnik: v.istochnik === 'fipi' || v.istochnik === 'new' ? v.istochnik : 'vse',
  };
}

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR3_KEY = 'budetege:zadanie-3:vybor:v1';
export const vybor3 = createSyncedStore<Vybor3>(VYBOR3_KEY, parseVybor, VYBOR3_DEFAULT);
