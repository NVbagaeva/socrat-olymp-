/**
 * Ответ ученика в тренажёре и опорных задачах №10 — по общему правилу
 * записи ответа (lib/otvet), как в №8, №3, №7 и №6: в бланк записывают
 * целое число или конечную десятичную дробь. Обыкновенная дробь с
 * верным значением («3/4» вместо «0,75») — подсказка, попытка не
 * тратится. Прежде №10 засчитывал и дробь (answerMatches из
 * lib/zadanie10/secret.ts); та проверка осталась для листов и самотеста,
 * отпечатки ответов те же.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { estPi } from '@/lib/zadanie7/otvet';
import { answerMatches } from '../secret';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed10(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}

/** Ответ ученика: записан через π — своя подсказка, иначе — по правилам бланка. */
export function proverit10(vvod: string, seal: string): Reading | { kind: 'pi' } {
  return estPi(vvod) ? { kind: 'pi' } : readSealed10(vvod, seal);
}
