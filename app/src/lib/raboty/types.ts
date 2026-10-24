/**
 * Выданные варианты с частью 2: работа, ответы, фото, баллы по
 * критериям, история. Поля — как в базе
 * (supabase/migrations/20261024120000_raboty_chast2.sql).
 */

import type { Itog } from '@/lib/chast2/sravnenie';
import type { Person } from '@/lib/kabinet/types';

export type Part2Mode = 'teacher' | 'self';
export type SubStatus = 'draft' | 'submitted' | 'checking' | 'checked' | 'returned';
export type GradeReason = 'auto' | 'grade' | 'part1' | 'reopen' | 'finish' | 'return';

export interface VariantWork {
  id: string;
  tutorId: string;
  classId: string | null;
  title: string;
  note: string | null;
  /** Код набора («PV-07») и версия в нём. */
  code: string;
  versiya: number;
  part2Mode: Part2Mode;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface Answer {
  taskNo: number;
  /** '' — часть 1 и задачи без пунктов; иначе номер пункта «0», «1». */
  punkt: string;
  vvod: unknown;
  /** Автопроверка части 2 (сервис проверки); null — не проверено. */
  auto: Itog | null;
  updatedAt: string;
}

export interface Photo {
  id: string;
  taskNo: number;
  position: number;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  expiresAt: string;
}

export interface Grade {
  taskNo: number;
  ball: number;
  /** Строка критериев сверху (с нуля) и вариант «ИЛИ» в ней. */
  kriteriy: number | null;
  ili: number | null;
  nePristupal: boolean;
  vruchnuyu: boolean;
  naDorabotke: boolean;
  comment: string | null;
  updatedAt: string;
}

export interface HistoryRow {
  taskNo: number | null;
  oldBall: number | null;
  newBall: number | null;
  reason: GradeReason;
  by: string;
  at: string;
}

export interface Score {
  part1: number;
  part2: number;
  total: number;
  max1: 13;
  max2: 20;
  max: 33;
  /** Сколько заданий 14–20 ещё не оценено. */
  ungraded2: number;
  /** Тестовый балл — только у проверенной работы. */
  test: number | null;
}

/** Пометки учителя на фото: координаты — доли ширины и высоты (0…1). */
export type MarkItem =
  | { t: 'pen'; pts: [number, number][] }
  | { t: 'ok' | 'no'; x: number; y: number }
  | { t: 'text'; x: number; y: number; s: string };

export interface MarkLayer {
  v: 1;
  items: MarkItem[];
}

export interface Submission {
  id: string;
  status: SubStatus;
  submittedAt: string | null;
  checkedAt: string | null;
  comment: string | null;
}

/** Работа глазами ученика. */
export interface StudentWork {
  work: VariantWork;
  tutor: Person;
  /** Срок для этого ученика (с продлением). */
  deadline: string | null;
  submission: Submission | null;
  answers: Answer[];
  photos: Photo[];
  /** Баллы видны после проверки; до неё — только часть 1 и «на доработке». */
  grades: Grade[];
  marks: Record<string, MarkLayer>;
  score: Score | null;
  /** Можно ли менять задание сейчас. */
  editable: number[];
}

/** Строка списка «Работы на проверку». */
export interface CheckRow {
  submissionId: string;
  workId: string;
  title: string;
  code: string;
  versiya: number;
  student: Person;
  status: SubStatus;
  submittedAt: string | null;
  checkedAt: string | null;
  late: boolean;
  score: Score;
}

/** Работа на экране проверки. */
export interface CheckWork extends Omit<StudentWork, 'tutor' | 'editable'> {
  submission: Submission;
  student: Person;
  history: HistoryRow[];
}

/** Выданная учителем работа со сводкой. */
export interface IssuedWork {
  work: VariantWork;
  recipients: {
    student: Person;
    deadline: string | null;
    status: SubStatus | 'none';
    submissionId: string | null;
    score: Score | null;
  }[];
}

export interface IssueWorkInput {
  title: string;
  note: string | null;
  dueAt: string | null;
  classId: string | null;
  students: string[];
  code: string;
  versiya: number;
  part2Mode: Part2Mode;
}

export interface Notice {
  id: string;
  kind: 'work_issued' | 'work_checked' | 'work_regraded' | 'task_returned' | 'work_submitted';
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
}

/** Отчёт по выданной работе: баллы каждого ученика по заданиям. */
export interface WorkReport {
  work: VariantWork;
  rows: {
    student: Person;
    status: SubStatus | 'none';
    submittedAt: string | null;
    /** Балл по номеру задания; null — нет оценки. */
    bally: Record<number, number | null>;
    score: Score | null;
  }[];
}
