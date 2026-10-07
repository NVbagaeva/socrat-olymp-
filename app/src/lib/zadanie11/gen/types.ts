/**
 * Обратная генерация задач №11: сначала выбираем красивый ответ и
 * «внутренние» величины (скорости, времена, массы), потом считаем
 * данные условия. Генератор подтипа возвращает параметры и ответ,
 * который он задумал; функция подтипа `solve` обязана получить тот
 * же ответ — это независимая проверка.
 */

import type { Rng } from '../../vychisleniya/rng';
import type { Params } from '../types';

export type { Rng };

export interface Zagotovka {
  params: Params;
  /** Ответ, задуманный генератором. */
  answer: number;
  /**
   * Признак случая для проверки разнообразия: «с остатком» / «нацело»,
   * «вверх» / «вниз». Генератор разминки ставит его там, где это важно.
   */
  sluchay?: string;
}

/** Генератор подтипа: null — параметры не подошли, нужна новая попытка. */
export type Gen = (r: Rng) => Zagotovka | null;

/** Целое ли (с допуском на двоичную арифметику). */
export function cel(x: number): boolean {
  return Math.abs(x - Math.round(x)) < 1e-9;
}

/** Конечная десятичная дробь не длиннее `places` знаков. */
export function des(x: number, places = 1): boolean {
  return cel(x * 10 ** places);
}

/** Шаг: случайное число из a…b с шагом step. */
export function shag(r: Rng, a: number, b: number, step: number): number {
  return a + step * r.int(0, Math.floor((b - a) / step));
}
