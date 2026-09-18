/**
 * Числа и подписи в условиях задания №3.
 *
 * Условие набирается так, как его набирает задачник: десятичная
 * запятая, буквы вершин с нижним индексом, знак умножения не
 * пишется. Формулы набора KaTeX здесь не нужны: в условиях
 * стереометрии формул нет, есть только буквы и числа.
 */

import { subscript } from '../solid/figures';
import { type AnswerFormat } from './types';

/** Число в условии: 2,5 — с запятой, как в задачнике. */
export function ru(value: number): string {
  return String(value).replace('.', ',');
}

/** Имя вершины или отрезка с индексами: AC1 → AC₁. */
export function letters(name: string): string {
  return subscript(name);
}

/** Отрезок по паре вершин: ['D', 'B1'] → DB₁. */
export function segment(pair: readonly [string, string]): string {
  return subscript(pair[0] + pair[1]);
}

/**
 * Ответ в том виде, в каком его вводят на ЕГЭ.
 * Целое — без запятой, десятичная дробь — с запятой.
 */
export function answerText(value: number, format: AnswerFormat): string {
  if (format === 'на-пи') {
    return ru(round(value));
  }
  return ru(round(value));
}

/** Убрать машинную погрешность: 79,99999999 — это 80. */
export function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * Подходит ли число под формат ответа ЕГЭ: целое или конечная
 * десятичная дробь. Дробь считается конечной, если у неё не больше
 * трёх знаков после запятой и она точно представима.
 */
export function fitsFormat(value: number, format: AnswerFormat): boolean {
  const v = round(value);
  if (!Number.isFinite(v)) {
    return false;
  }
  if (format === 'целое') {
    return Number.isInteger(v);
  }
  /* Конечная десятичная: домножение на 1000 даёт целое. */
  return Number.isInteger(round(v * 1000));
}

/**
 * Слово «раз» в нужной форме: «в 2 раза», «в 5 раз», «в 1,5 раза».
 * Дробные множители всегда идут с «раза».
 */
export function razaWord(value: number): string {
  if (!Number.isInteger(value)) {
    return 'раза';
  }
  const tens = value % 100;
  const ones = value % 10;
  if (tens >= 12 && tens <= 14) {
    return 'раз';
  }
  return ones >= 2 && ones <= 4 ? 'раза' : 'раз';
}
