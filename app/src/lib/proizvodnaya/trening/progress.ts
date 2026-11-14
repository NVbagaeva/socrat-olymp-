'use client';

/**
 * Хранилища тренажёра №9: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), тот же ключ, в который уже пишет
 * прежний тренажёр (lib/proizvodnaya/progress.ts):
 * budetege:proizvodnaya-9:log:v1. Тип попытки (kind) — прототип
 * («9.2.1»), задача — «прототип|seed». Прежний ключ
 * budetege:proizvodnaya-9:v1 сворачивается в журнал при первом чтении
 * (LEGACY_LOGS) и сам остаётся на месте.
 *
 * Оба хранилища — synced: у гостя они живут только в браузере, со
 * входом — ещё и в аккаунте. Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

export const PROGRESS9_KEY = 'budetege:proizvodnaya-9:log:v1';
export const log9 = createLogStore(PROGRESS9_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR9_KEY = 'budetege:zadanie-9:vybor:v1';
export const vybor9 = createVyborBanka(VYBOR9_KEY);
