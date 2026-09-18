/**
 * Математика в текстах задания №3.
 *
 * Вся она идёт через KaTeX: имена вершин, числа, корни, дроби. В
 * строке условия формула помечена долларами — `$DB_1 = 6$`, — а
 * набирает её typeset() на сборке. Юникод-индексов (₁) и знака «√»
 * в текстах быть не должно: буква в формуле курсивная, цифра
 * прямая, вокруг «=» стоят пробелы — всё это KaTeX делает сам, а
 * набранный руками символ ничего этого не даёт.
 *
 * Единственное место, где Юникод-индекс остаётся, — alt, <title> и
 * aria-label: `$A_1$` вслух не прочитать. Для них letters() и
 * segment(), они так и называются: «буквами».
 */

import { subscript } from '../solid/figures';
import { type AnswerFormat } from './types';

/** Число в тексте вне формулы: 2,5 — с запятой. */
export function ru(value: number): string {
  return String(value).replace('.', ',');
}

/**
 * Имя вершины в записи TeX: C1 → C_1, ABCDA1B1C1D1 →
 * ABCDA_1B_1C_1D_1. Долларов не ставит: их ставит тот, кто собирает
 * формулу целиком.
 */
export function tex(name: string): string {
  return name.replace(/\d+/g, (digits) => (digits.length === 1 ? `_${digits}` : `_{${digits}}`));
}

/** Число в записи TeX: 1,5 → 1{,}5. Фигурные скобки убирают у
    запятой отбивку знака препинания. */
export function texChislo(value: number): string {
  return String(value).replace('.', '{,}');
}

/** Имя фигуры или вершины формулой: 'C1' → `$C_1$`. */
export function imya(name: string): string {
  return `$${tex(name)}$`;
}

/** Отрезок формулой: ['D', 'B1'] → `$DB_1$`. */
export function otr(pair: readonly [string, string]): string {
  return `$${tex(pair[0] + pair[1])}$`;
}

/** Число формулой: 1.5 → `$1{,}5$`. */
export function chislo(value: number): string {
  return `$${texChislo(value)}$`;
}

/** Равенство формулой: ['D','D1'] и 2 → `$DD_1 = 2$`. */
export function ravno(pair: readonly [string, string], value: number): string {
  return `$${tex(pair[0] + pair[1])} = ${texChislo(value)}$`;
}

/** Готовая запись TeX в текст: 'AC = \\sqrt{45}' → `$AC = \\sqrt{45}$`. */
export function formula(body: string): string {
  return `$${body}$`;
}

/** Квадратный корень формулой: 75 → `$\sqrt{75}$`. */
export function koren(value: number): string {
  return `$\\sqrt{${texChislo(value)}}$`;
}

/** Градусы формулой: 60 → `$60^\circ$`. */
export function gradusy(value: number): string {
  return `$${texChislo(value)}^\\circ$`;
}

/**
 * Имя вершины или отрезка буквами: AC1 → AC₁.
 * Только для alt, <title> и aria-label — в видимом тексте формула.
 */
export function letters(name: string): string {
  return subscript(name);
}

/** Отрезок буквами: ['D', 'B1'] → DB₁. Только для alt. */
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
