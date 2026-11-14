'use client';

/**
 * Хранилища тренажёра №11: журнал попыток и последний выбор тренировки.
 *
 * Журнал — тот же ключ, что у прежнего тренажёра после перевода на
 * общий журнал (budetege:zadanie-11:log:v1): прежние счётчики
 * budetege:zadanie-11:v1 сворачиваются в него при первом чтении
 * (LEGACY_LOGS) и сами остаются на месте. Тип попытки (kind) — подтип
 * «DP-07», задача — ключ «DP-07|b12».
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

export const PROGRESS11_KEY = 'budetege:zadanie-11:log:v1';
export const log11 = createLogStore(PROGRESS11_KEY);

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const VYBOR11_KEY = 'budetege:zadanie-11:vybor:v1';
export const vybor11 = createVyborBanka(VYBOR11_KEY);
