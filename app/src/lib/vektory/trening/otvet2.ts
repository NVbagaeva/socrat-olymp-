/**
 * Ответ ученика в тренажёре и опорных задачах №2 — по общему правилу
 * записи ответа (lib/otvet), как в №8, №3, №7 и №6: в бланк записывают
 * целое число или конечную десятичную дробь. Обыкновенная дробь с
 * верным значением — подсказка, попытка не тратится. Отпечатки
 * ответов — прежние (lib/vektory/secret.ts).
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches } from '../secret';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed2(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}
