'use client';

/**
 * Хранилища тренажёра №13: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), тот же ключ, в который после PR #340
 * писал прежний тренажёр (lib/zadanie13/progress.ts, trenazher13). Тип
 * попытки (kind) — прототип («A-01»), задача — «A-01|b3». Прежний ключ
 * budetege:zadanie-13:v1 сворачивается в журнал при первом чтении
 * (LEGACY_LOGS) и сам остаётся на месте.
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

export const PROGRESS13_KEY = 'budetege:zadanie-13:log:v1';
export const log13 = createLogStore(PROGRESS13_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR13_KEY = 'budetege:zadanie-13:vybor:v1';
export const vybor13 = createVyborBanka(VYBOR13_KEY);
