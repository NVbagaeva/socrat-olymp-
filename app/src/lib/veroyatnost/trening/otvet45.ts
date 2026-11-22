/**
 * Ответ ученика в тренажёре и опорных задачах №4 и №5 — по общему
 * правилу записи ответа (lib/otvet), как в №8, №3, №7, №6: в бланк
 * записывают целое число или конечную десятичную дробь. Обыкновенная
 * дробь с верным значением («1/4» вместо «0,25») — подсказка, попытка
 * не тратится. Прежде №4 и №5 засчитывали и дробь (secret.ts,
 * answerMatches); та проверка осталась для листов и самотеста,
 * отпечатки ответов те же.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches } from '../secret';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed45(vvod: string, seal: string, klyuch: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal, klyuch));
}
