/**
 * Ответ ученика в тренажёре и опорных задачах №9 — по общему правилу
 * записи ответа (lib/otvet), как в №8, №3, №7, №6 и №2: в бланк
 * записывают целое число или конечную десятичную дробь. Обыкновенная
 * дробь с верным значением — подсказка, попытка не тратится. Отпечатки
 * ответов — прежние (lib/proizvodnaya/secret.ts).
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches } from '../secret';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed9(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}
