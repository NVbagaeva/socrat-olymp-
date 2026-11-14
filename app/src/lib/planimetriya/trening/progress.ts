'use client';

/**
 * Хранилища тренажёра №1: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), тот же ключ, в который писал
 * прежний тренажёр (lib/planimetriya/progress.ts: progress1). Тип
 * попытки (kind) — прототип («p05»), задача — ключ задачи («p05|b12»).
 * Прежний ключ счётчиков budetege:planimetriya-1:v1 сворачивается в
 * журнал при первом чтении (LEGACY_LOGS) и сам остаётся на месте.
 */

import { createLogStore } from '../../progressLog';
import { createVyborBanka } from '../../trening/vybor';

export const PROGRESS1_KEY = 'budetege:planimetriya-1:log:v1';
export const log1 = createLogStore(PROGRESS1_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR1_KEY = 'budetege:planimetriya-1:vybor:v1';
export const vybor1 = createVyborBanka(VYBOR1_KEY);
