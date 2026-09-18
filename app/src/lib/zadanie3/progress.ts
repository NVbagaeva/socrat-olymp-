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
}

const EMPTY: Z3Progress = { kinds: {}, mistakes: [] };

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
    const source = value as { kinds?: unknown; mistakes?: unknown };
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
    return { kinds, mistakes };
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
 * Записать закрытое задание: счётчики типа.
 *
 * Номера варианта здесь нет: счётчики идут по типу задания, а по
 * вариантам считается только список ошибок.
 *
 * right — решено ли верно с первой попытки: именно это считается
 * точностью. Ошибся и потом решил — задание закрыто, но в точность
 * не идёт.
 *
 * Списка ошибок эта запись не касается. В повторение задание
 * попадает при первом неверном ответе (markMistake) — иначе
 * брошенная нерешённой задача не попадала туда вовсе, — а уходит
 * оттуда, только когда решено верно в самом повторении
 * (clearMistake).
 */
export function recordTask(kind: string, right: boolean, seconds: number): void {
  const current = snapshot();
  const tally = current.kinds[kind] ?? { done: 0, right: 0, seconds: 0 };

  write({
    kinds: {
      ...current.kinds,
      [kind]: {
        done: tally.done + 1,
        right: tally.right + (right ? 1 : 0),
        seconds: tally.seconds + Math.max(0, Math.round(seconds)),
      },
    },
    mistakes: current.mistakes,
  });
}

/**
 * Отправить задание в повторение.
 *
 * Зовётся на неверном ответе, поэтому задание попадает в повторение
 * сразу — и остаётся там, даже если ученик бросил его нерешённым.
 * Счётчиков не трогает: точность и «неверно» считаются по закрытым
 * заданиям, как считались.
 */
export function markMistake(kind: string, n: number): void {
  const current = snapshot();
  const key = taskKey(kind, n);
  if (current.mistakes.includes(key)) {
    return;
  }
  write({ kinds: current.kinds, mistakes: [...current.mistakes, key] });
}

/**
 * Убрать задание из повторения: его решили верно в самом повторении.
 * Верный ответ в обычном режиме ничего отсюда не убирает — иначе
 * повторение опустошалось бы само собой, мимо ученика.
 */
export function clearMistake(kind: string, n: number): void {
  const current = snapshot();
  const key = taskKey(kind, n);
  if (!current.mistakes.includes(key)) {
    return;
  }
  write({ kinds: current.kinds, mistakes: current.mistakes.filter((item) => item !== key) });
}

/** Стереть счёт задания №3. Задания №12 это не касается. */
export function resetZ3(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(Z3_TRAINER_KEY);
  } catch {
    /* Нечего стирать — и ладно. */
  }
  listeners.forEach((fn) => fn());
}

export interface Z3Summary {
  done: number;
  right: number;
  wrong: number;
  /** Доля верных с первой попытки, 0…100. Заданий нет — null. */
  accuracy: number | null;
  /** Среднее время на задание в секундах. Заданий нет — null. */
  average: number | null;
}

/** Итог по всем типам. */
export function summarize(progress: Z3Progress): Z3Summary {
  const list = Object.values(progress.kinds);
  const done = list.reduce((sum, item) => sum + item.done, 0);
  const right = list.reduce((sum, item) => sum + item.right, 0);
  const seconds = list.reduce((sum, item) => sum + item.seconds, 0);
  return {
    done,
    right,
    wrong: done - right,
    accuracy: done === 0 ? null : Math.round((right / done) * 100),
    average: done === 0 ? null : Math.round(seconds / done),
  };
}

/**
 * Тип с наименьшей точностью: его и стоит повторить. Считаются
 * только типы, где хотя бы одно задание закрыто, — по нерешённому
 * судить не о чем. Всё верно везде — null, советовать нечего.
 */
export function weakestKind(progress: Z3Progress): string | null {
  const rows = Object.entries(progress.kinds).filter(([, tally]) => tally.done > 0);
  if (rows.length === 0) {
    return null;
  }
  const sorted = [...rows].sort((a, b) => {
    const left = a[1].right / a[1].done;
    const right = b[1].right / b[1].done;
    if (left !== right) {
      return left - right;
    }
    /* При равной точности вперёд идёт тот, где заданий закрыто
       больше: там оценка надёжнее. */
    return b[1].done - a[1].done;
  });
  const worst = sorted[0] as [string, KindTally];
  return worst[1].right === worst[1].done ? null : worst[0];
}
