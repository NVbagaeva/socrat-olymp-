/**
 * Проверка ответов онлайн-варианта — отдельно от экрана.
 *
 * Экран знает только интерфейс `Proverka`. На этапе 1 у него одна
 * реализация — в браузере (`localProverka`): верные ответы приходят из
 * собранного по коду варианта. На этапе 2 появится вторая — функции
 * базы через RPC (`check_answer`, `submit_work`): верные ответы не
 * покидают сервер до завершения работы, экран не меняется.
 *
 * Подсчёт баллов (`scoreWork`) — чистая функция: её зовут и экран
 * результатов, и страница «Проверить результат ученика», и статистика.
 */

import { BALLY } from '@/content/variantOnline/bally';
import { TESTOVYJ } from '@/content/variantOnline/shkala';
import { EGE_NUMBERS, type EgeNo } from '../types';
import { normalizeAnswer, sameAnswer, type FormatProblem } from './normalize';

/** Что ответить ученику на один ответ. */
export type Verdict =
  { kind: 'right' } | { kind: 'wrong' } | { kind: 'format'; problem: FormatProblem };

/** Задание работы с верным ответом — только для локальной проверки. */
export interface KeyItem {
  egeNumber: EgeNo;
  /** Ответ в записи бланка: «−2,25». */
  answer: string;
}

/** Итог проверки работы целиком. */
export interface WorkCheck {
  right: boolean[];
  /** Верные ответы — открываются только после завершения. */
  answers: string[];
}

export interface Proverka {
  /** Тренировка: проверить ответ на задание `index` сразу. */
  checkOne(index: number, input: string): Promise<Verdict>;
  /** Завершение работы: все ответы (первые попытки) → верно/неверно и ключ. */
  finish(answers: readonly string[]): Promise<WorkCheck>;
}

/** Один ответ против верного: формат, потом число. */
export function verdictOf(input: string, correct: string): Verdict {
  const n = normalizeAnswer(input);
  if (!n.ok) return { kind: 'format', problem: n.problem };
  return sameAnswer(input, correct) ? { kind: 'right' } : { kind: 'wrong' };
}

/** Проверка в браузере (этап 1): ключ — из варианта, собранного по коду. */
export function localProverka(key: readonly KeyItem[]): Proverka {
  return {
    checkOne(index, input) {
      const item = key[index];
      return Promise.resolve(
        item === undefined ? { kind: 'wrong' } : verdictOf(input, item.answer),
      );
    },
    finish(answers) {
      return Promise.resolve({
        right: key.map((item, i) => sameAnswer(answers[i] ?? '', item.answer)),
        answers: key.map((item) => item.answer),
      });
    },
  };
}

/* ── Баллы ──────────────────────────────────────────────────────── */

export interface Score {
  primary: number;
  max: number;
  /** Процент от максимума, целый. */
  percent: number;
  /**
   * Тестовый балл по шкале (ориентировочно). null — в варианте не все
   * задания 1–13: тогда показываются первичный балл и процент.
   */
  test: number | null;
}

/** Все ли задания 1–13 в варианте, каждое по разу. */
export function fullPartOne(numbers: readonly EgeNo[]): boolean {
  return numbers.length === EGE_NUMBERS.length && EGE_NUMBERS.every((n) => numbers.includes(n));
}

/** Первичный балл → тестовый по шкале; за краем шкалы — 100. */
export function testScore(primary: number): number {
  const row = TESTOVYJ[Math.max(0, Math.round(primary))];
  return row ?? 100;
}

export function scoreWork(numbers: readonly EgeNo[], right: readonly boolean[]): Score {
  let primary = 0;
  let max = 0;
  numbers.forEach((n, i) => {
    const w = BALLY[n];
    max += w;
    if (right[i] === true) primary += w;
  });
  return {
    primary,
    max,
    percent: max === 0 ? 0 : Math.round((primary / max) * 100),
    test: fullPartOne(numbers) ? testScore(primary) : null,
  };
}
