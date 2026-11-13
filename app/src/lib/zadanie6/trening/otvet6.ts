/**
 * Ответ ученика в тренажёре и опорных задачах №6 — по общему правилу
 * записи ответа (lib/otvet), как в №8, №3 и №7: в бланк записывают
 * целое число или конечную десятичную дробь. Обыкновенная дробь с
 * верным значением («3/4» вместо «0,75») — подсказка, попытка не
 * тратится. Прежде №6 засчитывал и дробь (lib/zadanie6/otvet.ts); та
 * проверка осталась для листов и самотеста, отпечатки ответов те же.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches6 } from '../otvet';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed6(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches6(value, seal));
}
