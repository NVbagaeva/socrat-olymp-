'use client';

/**
 * Прогресс тренажёра задания №3.
 *
 * Лежит отдельным ключом от задания №12: «Сбросить» в стереометрии
 * не должен стирать счёт по графикам функций, и наоборот. Ключи
 * разные, пересечься им негде.
 *
 *   budetege:z3:trainer:v1 — счётчики по типам и список ошибок
 *
 * Правильных ответов здесь нет и не будет: только счётчики, секунды
 * и номера заданий, в которых ошиблись.
 *
 * Хранилище читается через useSyncExternalStore: на сервере снимок
 * всегда пустой, поэтому первая отрисовка показывает нули и
 * расхождению при гидратации взяться неоткуда.
 */

import { useSyncExternalStore } from 'react';

/** Ключ хранения задания №3. Версия в имени: формат ещё может поменяться. */
export const Z3_TRAINER_KEY = 'budetege:z3:trainer:v1';

/** Счётчики одного типа заданий. */
export interface KindTally {
  /** Сколько заданий этого типа закрыто. */
  done: number;
  /** Из них решено верно с первой попытки. */
  right: number;
  /** Сколько секунд на них ушло. */
  seconds: number;
}

export interface Z3Progress {
  /** Прототип → счётчики. */
  kinds: Record<string, KindTally>;
  /** Задания с ошибкой: «P03-01:3». */
  mistakes: string[];
  /** Задания, решённые верно (с первой попытки или нет): «P03-01:3». Фильтр «нерешённые». */
  solved: string[];
}

const EMPTY: Z3Progress = { kinds: {}, mistakes: [], solved: [] };

let cache: Z3Progress | null = null;
const listeners = new Set<() => void>();

function positive(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function parse(raw: string | null): Z3Progress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const source = value as { kinds?: unknown; mistakes?: unknown; solved?: unknown };
    const kinds: Record<string, KindTally> = {};
    if (typeof source.kinds === 'object' && source.kinds !== null) {
      Object.entries(source.kinds as Record<string, unknown>).forEach(([id, tally]) => {
        if (typeof tally === 'object' && tally !== null) {
          const item = tally as Record<string, unknown>;
          kinds[id] = {
            done: positive(item.done),
            right: positive(item.right),
            seconds: positive(item.seconds),
          };
        }
      });
    }
    const mistakes = Array.isArray(source.mistakes)
      ? source.mistakes.filter((item): item is string => typeof item === 'string')
      : [];
    const solved = Array.isArray(source.solved)
      ? source.solved.filter((item): item is string => typeof item === 'string')
      : [];
    return { kinds, mistakes, solved };
  } catch {
    return EMPTY;
  }
}

function read(): Z3Progress {
  try {
    return parse(window.localStorage.getItem(Z3_TRAINER_KEY));
  } catch {
    return EMPTY;
  }
}

function snapshot(): Z3Progress {
  if (cache === null) {
    cache = read();
  }
  return cache;
}

function serverSnapshot(): Z3Progress {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === Z3_TRAINER_KEY || event.key === null) {
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

function write(next: Z3Progress): void {
  cache = next;
  try {
    window.localStorage.setItem(Z3_TRAINER_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — счёт живёт до перезагрузки. Экран при
       этом работает, и это лучше, чем падение. */
  }
  listeners.forEach((fn) => fn());
}

/** Прогресс целиком. Перерисовка происходит сама при каждой записи. */
export function useZ3Progress(): Z3Progress {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Ключ задания в списке ошибок. */
export function taskKey(kind: string, n: number): string {
  return `${kind}:${n}`;
}

/**
 * Записать закрытое задание.
 *
 * right — решено ли верно с первой попытки: именно это считается
 * точностью. Ошибся и потом решил — задание закрыто, но в точность
 * не идёт и попадает в список ошибок. solved — задание решено верно
 * (хоть и не с первой попытки): оно уходит из «нерешённых».
 */
export function recordTask(
  kind: string,
  n: number,
  right: boolean,
  seconds: number,
  solved = true,
): void {
  const current = snapshot();
  const tally = current.kinds[kind] ?? { done: 0, right: 0, seconds: 0 };
  const key = taskKey(kind, n);
  const mistakes = right
    ? current.mistakes.filter((item) => item !== key)
    : current.mistakes.includes(key)
      ? current.mistakes
      : [...current.mistakes, key];
  const resheno =
    solved && !current.solved.includes(key) ? [...current.solved, key] : current.solved;

  write({
    kinds: {
      ...current.kinds,
      [kind]: {
        done: tally.done + 1,
        right: tally.right + (right ? 1 : 0),
        seconds: tally.seconds + Math.max(0, Math.round(seconds)),
      },
    },
    mistakes,
    solved: resheno,
  });
}
