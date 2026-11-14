'use client';

/**
 * Хранилища тренажёра №10: журнал попыток и последний выбор тренировки.
 *
 * Журнал — общий (lib/progressLog), ключ тот же, что у прежнего
 * тренажёра №10 (lib/zadanie10/progress.ts): он уже писал в журнал,
 * переносить нечего. Тип попытки (kind) — прототип банка («P11»).
 *
 * Оба хранилища — synced: у гостя они живут только в браузере, со
 * входом — ещё и в аккаунте. Ответов здесь нет.
 */

import { createVyborBanka } from '@/lib/trening/vybor';

export { log10, PROGRESS10_KEY } from '../progress';

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR10_KEY = 'budetege:zadanie-10:vybor:v1';
export const vybor10 = createVyborBanka(VYBOR10_KEY);
