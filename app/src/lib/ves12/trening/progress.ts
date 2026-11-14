'use client';

/**
 * Хранилища тренажёра №12: журнал попыток и последний выбор тренировки.
 *
 * Журнал — тот же, в который №12 пишет с #340 (lib/trainerProgress.ts,
 * ключ budetege:zadanie-12:log:v1): прежний ключ budetege:trainer:v1
 * сворачивается в него при первом чтении (LEGACY_LOGS) и остаётся на
 * месте. Тип попытки (kind) — набор движка («12Q.B»), задача — шаблон
 * («12Q.B-07»): так писал и прежний тренажёр.
 */

import { createVyborBanka } from '@/lib/trening/vybor';
import { log12, PROGRESS12_KEY } from '@/lib/trainerProgress';

export { log12, PROGRESS12_KEY };

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR12_KEY = 'budetege:zadanie-12:vybor:v1';
export const vybor12 = createVyborBanka(VYBOR12_KEY);
