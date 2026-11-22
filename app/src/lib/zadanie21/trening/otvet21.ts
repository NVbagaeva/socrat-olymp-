/**
 * Ответ ученика в тренажёре и опорных задачах — по общему правилу
 * записи ответа (lib/otvet): целое число или конечная десятичная
 * дробь. Обыкновенная дробь с верным значением — подсказка, попытка не
 * тратится.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches } from '../secret';

export function readSealed21(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}
