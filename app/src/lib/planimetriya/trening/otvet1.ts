/**
 * Ответ ученика в тренажёре и опорных задачах №1 — по общему правилу
 * записи ответа (lib/otvet), как в №8, №3, №7 и №6: в бланк записывают
 * целое число или конечную десятичную дробь. Обыкновенная дробь с
 * верным значением («1/2» вместо «0,5») — подсказка, попытка не
 * тратится. Прежде №1 засчитывал и дробь (lib/otpechatok: parseNumber);
 * та проверка осталась для листов, отпечатки ответов те же.
 */

import { readAnswer, type Reading } from '../../otvet';
import { answerMatches } from '../secret';

/** Прочитать ответ по правилам бланка и сверить с отпечатком задачи. */
export function readSealed1(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}
