'use client';

/**
 * Хранилища тренажёра №6: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), как у №8, №3 и №7. Тип попытки
 * (kind) — прототип банка («P04»). Прежний ключ budetege:zadanie-6:v1
 * (счётчики по прототипам и список ошибок, lib/zadanie6/progress.ts)
 * сворачивается в журнал при первом чтении (LEGACY_LOGS) и сам остаётся
 * на месте.
 *
 * Оба хранилища — synced: у гостя они живут только в браузере, со
 * входом — ещё и в аккаунте. Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

export const PROGRESS6_KEY = 'budetege:zadanie-6:log:v1';
export const log6 = createLogStore(PROGRESS6_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR6_KEY = 'budetege:zadanie-6:vybor:v1';
export const vybor6 = createVyborBanka(VYBOR6_KEY);
