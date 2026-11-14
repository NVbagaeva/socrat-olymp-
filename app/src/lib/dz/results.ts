/**
 * Результаты ДЗ для репетитора — чистые функции, без браузера.
 *
 * Таблица «ученик × задача» (клетка: верно / неверно / не решал, попытки,
 * время), сводка по типам («тип — 4 из 6 ошиблись») и план работы над
 * ошибками: кому и по каким задачам нужны аналоги.
 */

import type { HwAnswerView, HwRecipientView, HwState, HwTaskView } from './types';

/** Клетка таблицы. */
export type CellMark = 'right' | 'wrong' | 'revealed' | 'trying' | 'none' | 'known' | 'repeat';

export interface Cell {
  task: HwTaskView;
  answer: HwAnswerView | null;
  mark: CellMark;
}

export interface Row {
  student: HwRecipientView;
  cells: Cell[];
  right: number;
  /** Неверно или с открытым решением. */
  wrong: number;
  total: number;
  seconds: number;
}

export function markOf(answer: HwAnswerView | null): CellMark {
  if (answer === null) return 'none';
  const byState: Record<HwState, CellMark> = {
    right: 'right',
    wrong: 'wrong',
    revealed: 'revealed',
    open: answer.attempts > 0 ? 'trying' : 'none',
    known: 'known',
    repeat: 'repeat',
  };
  return byState[answer.state];
}

/** Задачи ученика по порядку: общие и его собственные. */
export function tasksOf(tasks: readonly HwTaskView[], studentId: string): HwTaskView[] {
  return tasks
    .filter((t) => t.studentId === null || t.studentId === studentId)
    .sort((a, b) => a.position - b.position);
}

export function table(
  tasks: readonly HwTaskView[],
  students: readonly HwRecipientView[],
  answers: readonly HwAnswerView[],
): Row[] {
  const byKey = new Map(answers.map((a) => [`${a.taskId}|${a.userId}`, a]));
  return students.map((student) => {
    const cells = tasksOf(tasks, student.userId).map((task) => {
      const answer = byKey.get(`${task.id}|${student.userId}`) ?? null;
      return { task, answer, mark: markOf(answer) };
    });
    return {
      student,
      cells,
      right: cells.filter((c) => c.mark === 'right').length,
      wrong: cells.filter((c) => c.mark === 'wrong' || c.mark === 'revealed').length,
      total: cells.length,
      seconds: cells.reduce((sum, c) => sum + (c.answer?.seconds ?? 0), 0),
    };
  });
}

export interface KindSummary {
  kind: string;
  /** Сколько учеников ошиблись хотя бы в одной задаче этого типа. */
  erred: number;
  /** Сколько учеников решали задачи этого типа (ответили хотя бы раз). */
  tried: number;
  /** Сколько учеников получили задачи этого типа. */
  assigned: number;
}

/** Сводка по типам — в порядке, в каком типы идут в ДЗ. */
export function byKind(rows: readonly Row[]): KindSummary[] {
  const order: string[] = [];
  const stats = new Map<
    string,
    { erred: Set<string>; tried: Set<string>; assigned: Set<string> }
  >();
  for (const row of rows) {
    for (const cell of row.cells) {
      const kind = cell.task.kind;
      if (!stats.has(kind)) {
        order.push(kind);
        stats.set(kind, { erred: new Set(), tried: new Set(), assigned: new Set() });
      }
      const s = stats.get(kind)!;
      s.assigned.add(row.student.userId);
      if (cell.mark !== 'none') s.tried.add(row.student.userId);
      if (cell.mark === 'wrong' || cell.mark === 'revealed') s.erred.add(row.student.userId);
    }
  }
  return order.map((kind) => {
    const s = stats.get(kind)!;
    return { kind, erred: s.erred.size, tried: s.tried.size, assigned: s.assigned.size };
  });
}

/** Работа над ошибками: ученик и задачи, по которым ему нужны аналоги. */
export interface MistakesPlan {
  studentId: string;
  taskIds: string[];
}

/**
 * Кому нужна работа над ошибками: задачи с ошибкой или открытым
 * решением. Задача с неверными попытками, которую ученик так и не решил,
 * тоже считается ошибкой.
 */
export function mistakesPlan(rows: readonly Row[]): MistakesPlan[] {
  return rows
    .map((row) => ({
      studentId: row.student.userId,
      taskIds: row.cells
        .filter((c) => c.mark === 'wrong' || c.mark === 'revealed' || c.mark === 'trying')
        .map((c) => c.task.id),
    }))
    .filter((plan) => plan.taskIds.length > 0);
}

/** Статус ДЗ для списка. */
export type HwStatus = 'new' | 'started' | 'submitted' | 'late' | 'closed';

export function statusOf(
  hw: { dueAt: string | null; closedAt: string | null },
  recipient: { startedAt: string | null; submittedAt: string | null },
  now: number = Date.now(),
): HwStatus {
  if (recipient.submittedAt !== null) return 'submitted';
  if (hw.closedAt !== null) return 'closed';
  if (hw.dueAt !== null && Date.parse(hw.dueAt) < now) return 'late';
  return recipient.startedAt === null ? 'new' : 'started';
}
