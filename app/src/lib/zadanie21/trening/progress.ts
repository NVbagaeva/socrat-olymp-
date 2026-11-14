'use client';

/**
 * Хранилища тренажёра: журнал попыток (тип попытки — прототип «P01»,
 * задача — «P01|k7») и последний выбор тренировки. Оба synced: у гостя
 * — только в браузере, со входом — ещё и в аккаунте
 * (lib/progressImport/registry.ts). Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';
import { createVyborBanka } from '@/lib/trening/vybor';

export const PROGRESS21_KEY = 'budetege:zadanie-21:log:v1';
export const log21 = createLogStore(PROGRESS21_KEY);

export const VYBOR21_KEY = 'budetege:zadanie-21:vybor:v1';
export const vybor21 = createVyborBanka(VYBOR21_KEY);
