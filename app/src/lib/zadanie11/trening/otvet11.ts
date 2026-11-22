/**
 * Ответ ученика в тренажёре №11 — по общему правилу записи ответа
 * (lib/otvet), как в №8, №3, №7 и №6: в бланк записывают целое число
 * или конечную десятичную дробь. Обыкновенная дробь с верным значением
 * («3/4» вместо «0,75») — подсказка, попытка не тратится.
 *
 * Прежде №11 засчитывал любую верную запись числа, дробь тоже
 * (lib/zadanie11/secret.ts, answerMatches). Та проверка осталась для
 * опорных задач и листов; отпечатки ответов те же.
 *
 * Ответ выбором (РЗ-17) — номер варианта, сверяется с отпечатком выбора.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches, choiceMatches } from '../secret';

export function readSealed11(vvod: string, seal: string): Reading {
  return readAnswer(vvod, 'trenazher', (value) => answerMatches(value, seal));
}

/** Ответ выбором: номер варианта. */
export function readChoice11(vvod: string, seal: string): Reading {
  return { kind: 'answer', value: vvod, right: choiceMatches(vvod, seal), viaFraction: false };
}
