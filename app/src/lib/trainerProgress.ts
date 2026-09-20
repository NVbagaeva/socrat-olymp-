'use client';

/**
 * Прогресс тренажёра.
 *
 * Лежит рядом с прогрессом подготовительных задач, но отдельным
 * ключом: «Сбросить» в тренажёре не должен стирать решённые навыки.
 *
 * Хранилище читается через useSyncExternalStore: на сервере снимок
 * всегда пустой, поэтому первая отрисовка показывает нули и
 * расхождению при гидратации взяться неоткуда.
 *
 * Правильных ответов здесь нет и не будет: хранятся только счётчики
 * и номера заданий, в которых ученик ошибся.
 */

import { useSyncExternalStore } from 'react';

/** Ключ хранения. Версия в имени: формат ещё может поменяться. */
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
}

/* Пустой снимок — одна и та же ссылка: иначе useSyncExternalStore
   зациклится, сверяя снимки. */
const EMPTY: TrainerProgress = { kinds: {}, mistakes: [] };

let cache: TrainerProgress | null = null;
const listeners = new Set<() => void>();

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Разбор записи из хранилища. Мусор и чужой формат считаем пустотой. */
function parse(raw: string | null): TrainerProgress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const source = value as { kinds?: unknown; mistakes?: unknown };
    const kinds: Record<string, TrainerKindTally> = {};
    if (typeof source.kinds === 'object' && source.kinds !== null) {
      Object.entries(source.kinds as Record<string, unknown>).forEach(([id, tally]) => {
        if (typeof tally === 'object' && tally !== null) {
          const item = tally as Record<string, unknown>;
          kinds[id] = {
            done: number(item.done),
            right: number(item.right),
            seconds: number(item.seconds),
          };
        }
      });
    }
    const mistakes = Array.isArray(source.mistakes)
      ? source.mistakes.filter((item): item is string => typeof item === 'string')
      : [];
    return { kinds, mistakes };
  } catch {
    return EMPTY;
  }
}

function read(): TrainerProgress {
  /* Приватный режим и запрет на хранилище: обращение само по себе
     может бросить исключение, поэтому в try завёрнуто и оно. */
  try {
    return parse(window.localStorage.getItem(TRAINER_KEY));
  } catch {
    return EMPTY;
  }
}

function snapshot(): TrainerProgress {
  if (cache === null) {
    cache = read();
  }
  return cache;
}

function serverSnapshot(): TrainerProgress {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  /* Вторая вкладка того же браузера: там решали — здесь показываем. */
  const sync = (event: StorageEvent) => {
    if (event.key === TRAINER_KEY || event.key === null) {
      cache = null;
      listeners.forEach((fn) => fn());
    }
  };
  window.addEventListener('storage', sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', sync);
  };
}

/** Прогресс целиком. Перерисовка происходит сама при каждой записи. */
export function useTrainerProgress(): TrainerProgress {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

function save(next: TrainerProgress): void {
  cache = next;
  try {
    window.localStorage.setItem(TRAINER_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — счётчики живут до перезагрузки. Экран
       при этом работает, и это лучше, чем падение. */
  }
  listeners.forEach((fn) => fn());
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
}

/**
 * Записать закрытое задание.
 *
 * Задание, пройденное начисто, уходит из списка ошибочных: ученик
 * его отработал. Ошибка или подсказка — наоборот, ставит его
 * в список, даже если верный ответ в итоге нашёлся.
 */
export function recordAttempt(attempt: TrainerAttempt): void {
  const current = snapshot();
  const tally = current.kinds[attempt.kind] ?? { done: 0, right: 0, seconds: 0 };

  const kinds: Record<string, TrainerKindTally> = {
    ...current.kinds,
    [attempt.kind]: {
      done: tally.done + 1,
      right: tally.right + (attempt.right ? 1 : 0),
      seconds: tally.seconds + Math.max(0, Math.round(attempt.seconds)),
    },
  };

  const mistakes = attempt.clean
    ? current.mistakes.filter((id) => id !== attempt.taskId)
    : current.mistakes.includes(attempt.taskId)
      ? current.mistakes
      : [...current.mistakes, attempt.taskId];

  save({ kinds, mistakes });
}

/** Очистить прогресс тренажёра. Опорные задачи не трогаем. */
export function resetTrainer(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(TRAINER_KEY);
  } catch {
    /* Нечего чистить — значит и записать не удавалось. */
  }
  listeners.forEach((fn) => fn());
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
