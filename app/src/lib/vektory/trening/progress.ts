'use client';

/**
 * Хранилища тренажёра №2: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), как у №8, №3, №7 и №6. Тип попытки
 * (kind) — прототип генератора («A6»). Прежний ключ budetege:vektory-2:v1
 * (счётчики по прототипам и список ошибок, lib/vektory/progress.ts)
 * сворачивается в журнал при первом чтении (LEGACY_LOGS) и сам остаётся
 * на месте.
 *
 * Оба хранилища — synced: у гостя они живут только в браузере, со
 * входом — ещё и в аккаунте. Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

/* Ключ журнала — тот же, что уже пишет прежний тренажёр в main (budetege:vektory-2:log:v1). */
export const PROGRESS2_KEY = 'budetege:vektory-2:log:v1';
export const log2 = createLogStore(PROGRESS2_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR2_KEY = 'budetege:zadanie-2:vybor:v1';
export const vybor2 = createVyborBanka(VYBOR2_KEY);
