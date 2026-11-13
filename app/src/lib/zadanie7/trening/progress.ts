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
import {
  createVyborBanka,
  parseVyborBanka,
  VYBOR_BANKA_DEFAULT,
  type VyborBanka,
} from '@/lib/trening/vybor';

export const PROGRESS7_KEY = 'budetege:zadanie-7:log:v1';
export const log7 = createLogStore(PROGRESS7_KEY);

export type Vybor7 = VyborBanka;
export const VYBOR7_DEFAULT = VYBOR_BANKA_DEFAULT;
export const parseVybor7 = parseVyborBanka;

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR7_KEY = 'budetege:zadanie-7:vybor:v1';
export const vybor7 = createVyborBanka(VYBOR7_KEY);
