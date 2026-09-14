/**
 * Счётчики тренажёра.
 *
 * Все до одного считаются из попыток, ни один не записан числом.
 * Стартовые значения приходят отдельным слагаемым из demo.ts и
 * исчезнут вместе с ним, когда появятся настоящие результаты.
 */

import type { TaskTypeId } from '@/data/taskTypes';

export interface Attempt {
  taskId: string;
  taskType: TaskTypeId;
  correct: boolean;
  /** Сколько секунд заняло задание. */
  seconds: number;
}

export interface Seed {
  total: number;
  solved: number;
  correct: number;
  averageSeconds: number;
}

export interface Statistics {
  total: number;
  solved: number;
  correct: number;
  wrong: number;
  /** Доля верных среди решённых, проценты. Нет решённых — null. */
  accuracy: number | null;
  /** Среднее время на задание, секунды. Нет решённых — null. */
  averageSeconds: number | null;
}

export interface TaskTypeRow {
  taskType: TaskTypeId;
  solved: number;
  correct: number;
  accuracy: number | null;
}

function share(correct: number, solved: number): number | null {
  return solved === 0 ? null : Math.round((correct / solved) * 1000) / 10;
}

/** Общие счётчики: попытки поверх стартовых значений. */
export function computeStatistics(attempts: Attempt[], seed: Seed | null): Statistics {
  const base = seed ?? { total: 0, solved: 0, correct: 0, averageSeconds: 0 };
  const solved = base.solved + attempts.length;
  const correct = base.correct + attempts.filter((a) => a.correct).length;
  const seconds =
    base.solved * base.averageSeconds + attempts.reduce((sum, a) => sum + a.seconds, 0);

  return {
    total: Math.max(base.total, solved),
    solved,
    correct,
    wrong: solved - correct,
    accuracy: share(correct, solved),
    averageSeconds: solved === 0 ? null : Math.round(seconds / solved),
  };
}

/** Разбивка по типам заданий. Строки без попыток не выбрасываются. */
export function computeByTaskType(attempts: Attempt[], types: TaskTypeId[]): TaskTypeRow[] {
  return types.map((taskType) => {
    const own = attempts.filter((a) => a.taskType === taskType);
    const correct = own.filter((a) => a.correct).length;
    return { taskType, solved: own.length, correct, accuracy: share(correct, own.length) };
  });
}
