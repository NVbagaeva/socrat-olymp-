'use client';

/**
 * Прогресс тренажёра.
 *
 * Лежит рядом с прогрессом подготовительных задач, но отдельным
 * ключом: «Сбросить» в тренажёре не должен стирать решённые навыки.
 *
 * Хранилище — журнал попыток (lib/progressLog): на сервере снимок
 * всегда пустой, поэтому первая отрисовка показывает нули и
 * расхождению при гидратации взяться неоткуда.
 *
 * Правильных ответов здесь нет и не будет: хранятся только счётчики
 * и номера заданий, в которых ученик ошибся.
 */

import {
  EMPTY_LOG,
  createLogStore,
  dropKinds,
  legacyView,
  outcomeOf,
  type LogOutcome,
  type ProgressLog,
} from './progressLog';

/** Прежний ключ хранения (счётчики): теперь только источник для журнала. */
export const TRAINER_KEY = 'budetege:trainer:v1';

/** Счётчики одного типа заданий. */
export interface TrainerKindTally {
  /** Сколько заданий этого типа закрыто. */
  done: number;
  /** Из них решено самостоятельно и верно. */
  right: number;
  /** Сколько секунд на них ушло. */
  seconds: number;
}

export interface TrainerProgress {
  /** Набор движка → счётчики. */
  kinds: Record<string, TrainerKindTally>;
  /** Задания, в которых ошиблись или брали подсказку. */
  mistakes: string[];
  /**
   * Задания, решённые верно без подсказки: «только нерешённые» и
   * прогресс на чипах тренажёра («8/12»). Записей до этого поля нет —
   * список начинается с первой решённой задачи. У хранилищ других
   * разделов (progressStore) поля нет: решённое там — в исходах.
   */
  solved?: string[];
}

/* Пустой снимок — одна и та же ссылка: иначе useSyncExternalStore
   зациклится, сверяя снимки. */
const EMPTY: TrainerProgress = { kinds: {}, mistakes: [], solved: [] };

/**
 * Журнал попыток №12 (lib/progressLog): счётчики, ошибки и решённые
 * задачи считаются из него. Прежний ключ TRAINER_KEY (счётчики)
 * сворачивается в журнал при первом чтении (LEGACY_LOGS) и остаётся как
 * был. Со входом журнал живёт в аккаунте (lib/progressImport/registry.ts).
 */
export const PROGRESS12_KEY = 'budetege:zadanie-12:log:v1';
export const log12 = createLogStore(PROGRESS12_KEY);

let seen: ProgressLog = EMPTY_LOG;
let view: TrainerProgress = EMPTY;

function viewOf(current: ProgressLog): TrainerProgress {
  if (current !== seen) {
    seen = current;
    const { kinds, mistakes, solved } = legacyView(current);
    view = { kinds, mistakes, solved };
  }
  return view;
}

/** Прогресс целиком. Перерисовка происходит сама при каждой записи. */
export function useTrainerProgress(): TrainerProgress {
  return viewOf(log12.use());
}

export interface TrainerAttempt {
  /** Набор движка: по нему счётчики раскладываются по типам. */
  kind: string;
  /** Номер задания, например «12.C-04». */
  taskId: string;
  /** Решено самостоятельно, без подсказки. */
  right: boolean;
  /** И при этом без единой ошибки: только такое уходит из списка. */
  clean: boolean;
  /** Сколько секунд заняло задание. */
  seconds: number;
  /** Точный исход для журнала попыток (lib/progressLog, ishodOf). */
  ishod?: LogOutcome;
}

/**
 * Записать закрытое задание.
 *
 * Задание, пройденное начисто, уходит из списка ошибочных: ученик
 * его отработал. Ошибка или подсказка — наоборот, ставит его
 * в список, даже если верный ответ в итоге нашёлся.
 */
export function recordAttempt(attempt: TrainerAttempt): void {
  log12.record({
    task: attempt.taskId,
    kind: attempt.kind,
    outcome: outcomeOf(attempt),
    seconds: Math.max(0, Math.round(attempt.seconds)),
  });
}

/** Очистить прогресс тренажёра. Опорные задачи не трогаем. */
export function resetTrainer(): void {
  log12.reset();
}

/** Набор, к которому относится задание: «12Q.C-04» → «12Q.C». */
function setOfTask(id: string): string {
  return id.split('-')[0] ?? id;
}

/**
 * Прогресс одного раздела. Счётчики всех разделов №12 лежат в одной
 * записи, а сводка на странице раздела должна считать только его
 * наборы: иначе на «Квадратичной функции» в «решено» шли бы задачи
 * линейной, а знаменатель — задачи одной квадратичной.
 */
export function progressOf(progress: TrainerProgress, sets: readonly string[]): TrainerProgress {
  return {
    kinds: Object.fromEntries(
      Object.entries(progress.kinds).filter(([kind]) => sets.includes(kind)),
    ),
    mistakes: progress.mistakes.filter((id) => sets.includes(setOfTask(id))),
    solved: (progress.solved ?? []).filter((id) => sets.includes(setOfTask(id))),
  };
}

/** Сбросить счётчики и ошибки одного раздела: другие разделы не трогаются. */
export function resetSets(sets: readonly string[]): void {
  log12.update((log) => dropKinds(log, (kind) => sets.includes(kind), setOfTask));
}

export interface TrainerSummary {
  done: number;
  right: number;
  wrong: number;
  /** Доля верных среди закрытых, проценты. Нет закрытых — null. */
  accuracy: number | null;
  /** Среднее время на задание, секунды. Нет закрытых — null. */
  averageSeconds: number | null;
}

/** Свод по всем типам сразу. */
export function summarize(progress: TrainerProgress): TrainerSummary {
  const list = Object.values(progress.kinds);
  const done = list.reduce((sum, item) => sum + item.done, 0);
  const right = list.reduce((sum, item) => sum + item.right, 0);
  const seconds = list.reduce((sum, item) => sum + item.seconds, 0);

  return {
    done,
    right,
    wrong: done - right,
    accuracy: done === 0 ? null : Math.round((right / done) * 100),
    averageSeconds: done === 0 ? null : Math.round(seconds / done),
  };
}
