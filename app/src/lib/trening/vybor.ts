'use client';

/**
 * Последний выбор на вкладке «Тренажёр» разделов с банком задач: типы,
 * число задач, таймер, «без подсказок», источник и (у №6) формулировка.
 * Synced: у гостя — в браузере, со входом — ещё и в аккаунте.
 */

import { createSyncedStore, type SyncedStore } from '@/lib/syncedStore';
import type { IstochnikBanka, StilBanka } from './bank';

export interface VyborBanka {
  /** Выбранные прототипы. Пусто — все. */
  tipy: string[];
  /** Сколько задач; null — без конца. */
  count: number | null;
  timer: boolean;
  /** Без подсказок и решений до итогов. */
  bezPodskazok: boolean;
  istochnik: IstochnikBanka;
  stil: StilBanka;
  /** Уровень (№13): все, базовый, повышенный. */
  uroven: 'vse' | '1' | '2';
  /** Как отвечать (№13): '' — числом, иначе id особого режима («oformlenie»). */
  rezhim: string;
}

export const VYBOR_BANKA_DEFAULT: VyborBanka = {
  tipy: [],
  count: 10,
  timer: true,
  bezPodskazok: false,
  istochnik: 'vse',
  stil: 'vse',
  uroven: 'vse',
  rezhim: '',
};

export function parseVyborBanka(value: unknown): VyborBanka {
  if (typeof value !== 'object' || value === null) {
    return VYBOR_BANKA_DEFAULT;
  }
  const v = value as Partial<VyborBanka>;
  return {
    tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
    count: v.count === null ? null : typeof v.count === 'number' && v.count > 0 ? v.count : 10,
    timer: v.timer !== false,
    bezPodskazok: v.bezPodskazok === true,
    istochnik: v.istochnik === 'fipi' || v.istochnik === 'new' ? v.istochnik : 'vse',
    stil: v.stil === 'syuzhet' || v.stil === 'standart' ? v.stil : 'vse',
    uroven: v.uroven === '1' || v.uroven === '2' ? v.uroven : 'vse',
    rezhim: typeof v.rezhim === 'string' && /^[a-z]{0,20}$/.test(v.rezhim) ? v.rezhim : '',
  };
}

export function createVyborBanka(key: string): SyncedStore<VyborBanka> {
  return createSyncedStore<VyborBanka>(key, parseVyborBanka, VYBOR_BANKA_DEFAULT);
}
