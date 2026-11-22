/**
 * Тренировка №10: ключи задач банка. Сама логика — общая
 * (lib/trening/bank.ts): у №10 своё только то, какие у задач ключи —
 * «F037» (открытый банк ФИПИ) или «P11-a07» (аналог).
 *
 * Прежний тренажёр №10 держал тренировку в sessionStorage
 * (budetege:zadanie-10:trenazher:v1) — до закрытия вкладки; теперь
 * она в общей записи сессии (lib/trainerSession, раздел «10»).
 */

import { isPayloadBanka, razobratZapis, type PayloadBanka } from '@/lib/trening/bank';

/** Ключи задач №10. */
export const KLYUCH10 = /^(F\d{3}|P\d\d-a\d\d)$/;

export function etoKlyuch10(id: string): boolean {
  return KLYUCH10.test(id);
}

export function isTrenazher10Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH10);
}

export function razobratZapis10(packed: unknown): PayloadBanka | null {
  return razobratZapis(packed, KLYUCH10);
}
