/**
 * Тренировка раздела: ключи задач. Сама логика тренировки — общая
 * (lib/trening/bank.ts).
 */

import { isPayloadBanka, razobratZapis, type PayloadBanka } from '@/lib/trening/bank';
import { KLYUCH21 } from '../zadacha';

export { KLYUCH21 };

export function isTrenazher21Payload(value: unknown): value is PayloadBanka {
  return isPayloadBanka(value, KLYUCH21);
}

export function razobratZapis21(packed: unknown): PayloadBanka | null {
  return razobratZapis(packed, KLYUCH21);
}
