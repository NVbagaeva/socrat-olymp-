/**
 * Тренировка №6: ключи задач банка. Сама логика — общая
 * (lib/trening/bank.ts): у №6 своё только то, какие у задач ключи —
 * «S03» (образец стороннего банка), «D01» (демоверсия ФИПИ) или
 * «P04-a12» (аналог).
 */

import { isPayloadBanka, razobratZapis, type PayloadBanka } from '@/lib/trening/bank';

/** Ключи задач №6. */
export const KLYUCH6 = /^(S\d\d|D\d\d|P\d\d-a\d\d)$/;

export function etoKlyuch6(id: string): boolean {
  return KLYUCH6.test(id);
}

export function isTrenazher6Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH6);
}

/** Запись тренировки; понимает и прежний формат тренажёра №6 (с режимом «Проверка»). */
export function razobratZapis6(packed: unknown): PayloadBanka | null {
  return razobratZapis(packed, KLYUCH6);
}
