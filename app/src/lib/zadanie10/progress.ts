'use client';

/**
 * Журнал попыток тренажёра №10 (lib/progressLog), как у №8 и №3.
 * Тип попытки (kind) — прототип («P11»), задача — её идентификатор в
 * банке. Со входом журнал живёт в аккаунте
 * (lib/progressImport/registry.ts). Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';

export const PROGRESS10_KEY = 'budetege:zadanie-10:log:v1';
export const log10 = createLogStore(PROGRESS10_KEY);
