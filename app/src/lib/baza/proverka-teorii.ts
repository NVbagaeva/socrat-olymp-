/**
 * «Проверь себя» в теории базы: наборы задач по ключу блока
 * `{ vid: 'proverka', nabor }` (content/baza/*). Задачи собираются на
 * сервере (lib/teoriya/proverka-server.ts) — в браузер уходят варианты
 * и отпечаток ответа, не генераторы. Сверку ответов делает pnpm test:baza.
 */

import { PROVERKA_17, type ShablonProverki17 } from './z17/proverka-teorii';

export const NABORY_PROVERKI_BAZY: Record<string, readonly ShablonProverki17[]> = {
  '17-lineynye': PROVERKA_17.lineynye,
  '17-kvadratnye': PROVERKA_17.kvadratnye,
  '17-koren': PROVERKA_17.koren,
  '17-pokazatelnye': PROVERKA_17.pokazatelnye,
  '17-logarifmy': PROVERKA_17.logarifmy,
  '17-otvet': PROVERKA_17.otvet,
};
