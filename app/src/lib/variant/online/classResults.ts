/**
 * Результаты класса по работе-варианту: таблица «ученики × номера»,
 * средние по классу и строки для Excel. Чистые функции — их же гоняет
 * автотест.
 */

import type { Person, VariantResult, VariantWorkView } from '@/lib/kabinet/types';
import type { Cell } from '@/lib/xlsx';
import { displayAnswer } from './normalize';
import { fullPartOne, testScore } from './proverka';
import type { EgeNo } from '../types';

export interface ResultRow {
  student: Person;
  /** Последняя завершённая попытка ученика (по любому варианту работы). */
  attempt: VariantResult | null;
  /** Номер варианта в работе. */
  variant: number | null;
  /** Тестовый балл, если в варианте все задания 1–13. */
  test: number | null;
}

export interface ClassTable {
  /** Номера ЕГЭ столбцов (по позициям варианта 1). */
  numbers: number[];
  rows: ResultRow[];
  /** Доля верных по столбцу среди сдавших, 0–1; null — никто не сдал. */
  average: (number | null)[];
  /** Средний первичный балл сдавших. */
  averagePrimary: number | null;
  /** Сдали / получателей. */
  finished: number;
  total: number;
}

export function classTable(view: VariantWorkView): ClassTable {
  const numbers = (view.tasks[0] ?? []).map((t) => t.egeNo);
  const rows: ResultRow[] = (view.results ?? []).map((r) => {
    const attempt =
      [...r.attempts].sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0] ??
      null;
    const nums =
      attempt === null ? [] : (view.tasks[attempt.variant - 1] ?? []).map((t) => t.egeNo as EgeNo);
    return {
      student: r.student,
      attempt,
      variant: attempt?.variant ?? null,
      test: attempt !== null && fullPartOne(nums) ? testScore(attempt.primary ?? 0) : null,
    };
  });
  const done = rows.filter((r) => r.attempt !== null);
  const average = numbers.map((_, i) => {
    if (done.length === 0) return null;
    return done.filter((r) => r.attempt?.tasks[i]?.right === true).length / done.length;
  });
  return {
    numbers,
    rows,
    average,
    averagePrimary:
      done.length === 0
        ? null
        : done.reduce((s, r) => s + (r.attempt?.primary ?? 0), 0) / done.length,
    finished: done.length,
    total: rows.length,
  };
}

/** Таблица для Excel: ученик, вариант, баллы, время, по номерам «ответ ✓/✗». */
export function excelRows(table: ClassTable): Cell[][] {
  const head: Cell[] = [
    'Ученик',
    'Вариант',
    'Первичный балл',
    'Из',
    'Тестовый (ориентир.)',
    'Время, мин',
    'Сдано',
    ...table.numbers.map((n) => `№${n}`),
  ];
  const body = table.rows.map((r): Cell[] => {
    const a = r.attempt;
    if (a === null) return [r.student.name, null, null, null, null, null, 'не сдано'];
    return [
      r.student.name,
      r.variant,
      a.primary,
      a.max,
      r.test,
      a.seconds === null ? null : Math.round((a.seconds / 60) * 10) / 10,
      `${a.finishedAt?.slice(0, 16).replace('T', ' ') ?? ''}${a.late ? ' (поздно)' : ''}`,
      ...a.tasks.map(
        (t) => `${t.answer === null ? '—' : displayAnswer(t.answer)} ${t.right ? '✓' : '✗'}`,
      ),
    ];
  });
  const avg: Cell[] = [
    'Среднее по классу',
    null,
    table.averagePrimary === null ? null : Math.round(table.averagePrimary * 10) / 10,
    null,
    null,
    null,
    `${table.finished} из ${table.total}`,
    ...table.average.map((x) => (x === null ? null : `${Math.round(x * 100)}%`)),
  ];
  return [head, ...body, avg];
}

/** Имя файла выгрузки: «Пробный ЕГЭ — 11 А.xlsx». */
export function excelName(view: VariantWorkView): string {
  const base = [view.work.title, view.work.className].filter(Boolean).join(' — ');
  return `${base.replace(/[\\/:*?"<>|]/g, ' ').trim() || 'Результаты'}.xlsx`;
}
