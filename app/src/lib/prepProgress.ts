'use client';

/**
 * Прогресс подготовительных задач.
 *
 * Личного кабинета пока нет, поэтому решённое живёт в браузере:
 * localStorage, до очистки кэша. На другом компьютере счёт будет
 * нулевым — это осознанная цена, а не недосмотр.
 *
 * Хранилище читается через useSyncExternalStore: на сервере снимок
 * всегда пустой, поэтому первая отрисовка показывает нули и
 * расхождению при гидратации взяться неоткуда.
 */

import { useSyncExternalStore } from 'react';

/** Ключ хранения. Версия в имени: формат ещё может поменяться. */
export const PREP_KEY = 'budetege:prep:v1';

/** Навык → номера решённых задач, 1…N. */
export type PrepProgress = Record<string, number[]>;

/* Пустой снимок — одна и та же ссылка: useSyncExternalStore сверяет
   снимки по ссылке и зациклится, если каждый раз отдавать новый. */
const EMPTY: PrepProgress = {};

let cache: PrepProgress | null = null;
const listeners = new Set<() => void>();

/** Разбор записи из хранилища. Мусор и чужой формат считаем пустотой. */
function parse(raw: string | null): PrepProgress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const out: PrepProgress = {};
    Object.entries(value as Record<string, unknown>).forEach(([id, list]) => {
      if (Array.isArray(list)) {
        out[id] = list.filter((item): item is number => typeof item === 'number' && item > 0);
      }
    });
    return out;
  } catch {
    return EMPTY;
  }
}

function read(): PrepProgress {
  /* Приватный режим и запрет на хранилище: обращение само по себе
     может бросить исключение, поэтому в try завёрнуто и оно. */
  try {
    return parse(window.localStorage.getItem(PREP_KEY));
  } catch {
    return EMPTY;
  }
}

function snapshot(): PrepProgress {
  if (cache === null) {
    cache = read();
  }
  return cache;
}

function serverSnapshot(): PrepProgress {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  /* Вторая вкладка того же браузера: там решали — здесь показываем. */
  const sync = (event: StorageEvent) => {
    if (event.key === PREP_KEY || event.key === null) {
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
export function usePrepProgress(): PrepProgress {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Сколько задач навыка решено. Больше, чем есть в наборе, не бывает. */
export function solvedCount(progress: PrepProgress, id: string, total: number): number {
  const list = progress[id];
  if (list === undefined) {
    return 0;
  }
  return list.filter((no) => no >= 1 && no <= total).length;
}

/** Решена ли эта задача навыка. */
export function isSolved(progress: PrepProgress, id: string, no: number): boolean {
  return (progress[id] ?? []).includes(no);
}

/**
 * Отметить задачу решённой.
 *
 * Повторная отметка ничего не меняет: номер уже в списке, счётчик
 * второй раз не растёт.
 */
export function markSolved(id: string, no: number): void {
  const current = snapshot();
  if ((current[id] ?? []).includes(no)) {
    return;
  }

  const next: PrepProgress = { ...current, [id]: [...(current[id] ?? []), no].sort((a, b) => a - b) };
  cache = next;
  try {
    window.localStorage.setItem(PREP_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — прогресс живёт до перезагрузки. Экран
       при этом работает, и это лучше, чем падение. */
  }
  listeners.forEach((fn) => fn());
}
