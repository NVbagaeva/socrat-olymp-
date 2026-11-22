'use client';

/**
 * Журнал попыток тренажёра №19 (lib/progressLog), как у №8 и №3.
 * Тип попытки (kind) — метод решения («m1» … по номеру метода в банке),
 * задача — её идентификатор в банке. Со входом журнал живёт в аккаунте
 * (lib/progressImport/registry.ts). Ответов здесь нет.
 */

import { createLogStore } from '@/lib/progressLog';

export const PROGRESS19_KEY = 'budetege:zadanie-19:log:v1';
export const log19 = createLogStore(PROGRESS19_KEY);

/** Тип попытки по номеру метода. */
export function kind19(metod: number): string {
  return `m${metod}`;
}
