/**
 * Домашнее задание — типы, общие для всех разделов.
 *
 * Задачи ДЗ хранятся готовыми (docs/kabinet-dz-8.md): условие видит
 * ученик, ответ и решение — только репетитор и только через базу.
 * Раздел (№8 и дальше №5, №7, №12) отвечает лишь за то, как собрать
 * задачи при выдаче: lib/dz/z08.ts.
 */

import type { RazborHtml } from '@/lib/vychisleniya/razbor';

/** Когда ученик видит решение. */
export type SolutionsWhen = 'instant' | 'after_submit' | 'after_due';

/** Откуда выдано ДЗ. */
export type HwOrigin = 'kabinet' | 'generator' | 'opornye' | 'trenazher' | 'oshibki';

/** Ход решения задачи. */
export type HwState = 'open' | 'right' | 'wrong' | 'revealed';

/** Попыток на задачу: 1, 2 или без ограничения. */
export type AttemptsLimit = 1 | 2 | null;

export interface HwSettings {
  title: string;
  note: string;
  /** ISO-время срока сдачи; null — без срока. */
  dueAt: string | null;
  attemptsLimit: AttemptsLimit;
  solutionsWhen: SolutionsWhen;
  /** «Запомни» — по умолчанию выключено. */
  showMemo: boolean;
  /** Разобранный пример — по умолчанию выключен. */
  showExample: boolean;
  /** У каждого ученика свои задачи. */
  individual: boolean;
}

/** Задача, собранная при выдаче: условие, ключ и решение. */
export interface HwTaskInput {
  /** null — задача для всех получателей. */
  studentId: string | null;
  position: number;
  /** Тип задачи: прототип «8.A». */
  kind: string;
  /** «прототип|seed|уровень» — для работы над ошибками и печати учителю. */
  ref: string;
  questionHtml: string;
  /** Нормальная запись ответа: «-2.25». */
  answer: string;
  razbor: RazborHtml;
  /** Источник — только для учителя: «банк 8.A № 3» или «новая». */
  source: string;
  comment: string | null;
}

export interface HwIssueInput {
  classId: string | null;
  students: string[];
  taskNo: number;
  settings: HwSettings;
  origin: HwOrigin;
  parentId: string | null;
  tasks: HwTaskInput[];
}

/** Задача так, как её видит ученик. */
export interface HwTaskView {
  id: string;
  position: number;
  kind: string;
  questionHtml: string;
  comment: string | null;
  studentId: string | null;
}

/** Ход решения задачи учеником. */
export interface HwAnswerView {
  taskId: string;
  userId: string;
  state: HwState;
  attempts: number;
  /** Что вводил: исходная запись, нормальная (или null), верно ли, когда. */
  entries: { a: string; n: string | null; ok: boolean; at: string }[];
  seconds: number;
}

export interface HwView {
  id: string;
  tutorId: string;
  classId: string | null;
  title: string;
  note: string;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
  taskNo: number;
  attemptsLimit: AttemptsLimit;
  solutionsWhen: SolutionsWhen;
  showMemo: boolean;
  showExample: boolean;
  individual: boolean;
  origin: HwOrigin;
  parentId: string | null;
}

export interface HwRecipientView {
  userId: string;
  name: string;
  startedAt: string | null;
  submittedAt: string | null;
}

/** Ответ базы на проверку ответа. */
export type HwCheck =
  | {
      kind: 'right' | 'wrong';
      state: HwState;
      attempts: number;
      /** Сколько попыток осталось; null — без ограничения. */
      left: number | null;
      solution: RazborHtml | null;
    }
  | { kind: 'fractionRight'; decimal: string }
  | { kind: 'format' }
  | { kind: 'closed'; state: HwState };

/** Решение задачи, когда его уже можно показать. */
export interface HwSolution {
  razbor: RazborHtml;
  /** Нормальная запись ответа. */
  answer: string;
}
