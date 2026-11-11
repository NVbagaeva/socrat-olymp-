'use client';

/**
 * Хранилища прогресса задания №8: тренажёр и подготовка.
 *
 * Свои ключи, чтобы «Сбросить» здесь не трогал другие задания.
 * Ответов в хранилищах нет: счётчики и идентификаторы задач.
 */

import { useSyncExternalStore } from 'react';
import { createProgressStore } from '../progressStore';

/** Тренажёр: счётчики по прототипам и список ошибок. */
export const progress8 = createProgressStore('budetege:vychisleniya-8:v1');

/* ── Маленькие хранилища рядом с прогрессом ──────────────────────
   Одно устройство на всех: JSON под своим ключом, чтение через
   useSyncExternalStore (на сервере — значение по умолчанию), запись
   с уведомлением подписчиков и соседних вкладок. Ответов здесь нет.
   Этап 2 кабинета подключит их к серверу тем же интерфейсом. */

interface JsonStore<T> {
  key: string;
  use(): T;
  read(): T;
  write(next: T): void;
  clear(): void;
}

function createJsonStore<T>(
  key: string,
  empty: T,
  parse: (value: unknown) => T | null,
): JsonStore<T> {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  function read(): T {
    if (cache !== null) {
      return cache;
    }
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw === null ? empty : (parse(JSON.parse(raw)) ?? empty);
    } catch {
      cache = empty;
    }
    return cache;
  }
  function notify(): void {
    listeners.forEach((fn) => fn());
  }
  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const sync = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        cache = null;
        notify();
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', sync);
    };
  }
  return {
    key,
    use() {
      return useSyncExternalStore(subscribe, read, () => empty);
    },
    read,
    write(next) {
      cache = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* Хранилище недоступно — значение живёт до перезагрузки. */
      }
      notify();
    },
    clear() {
      cache = empty;
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* Нечего чистить. */
      }
      notify();
    },
  };
}

/* ── Недавние попытки: «Стоит повторить» ─────────────────────────
   Плоский список последних закрытых задач: прототип, верно ли, когда.
   Группа «стоит повторить», если среди её последних пяти попыток
   две и больше неверных. */

export interface Popytka8 {
  /** Прототип: 8.A. */
  k: string;
  /** Верно ли (без ошибок и без открытого решения). */
  r: boolean;
  /** Когда, мс. */
  t: number;
}

const NEDAVNIE_LIMIT = 300;

function parsePopytki(value: unknown): Popytka8[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item) =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Popytka8).k === 'string' &&
    typeof (item as Popytka8).r === 'boolean' &&
    typeof (item as Popytka8).t === 'number'
      ? [item as Popytka8]
      : [],
  );
}

const NEDAVNIE_EMPTY: Popytka8[] = [];

export const nedavnie8 = createJsonStore<Popytka8[]>(
  'budetege:vychisleniya-8:nedavnie:v1',
  NEDAVNIE_EMPTY,
  parsePopytki,
);

export function zapisatPopytku8(prototype: string, right: boolean): void {
  const list = [...nedavnie8.read(), { k: prototype, r: right, t: Date.now() }];
  nedavnie8.write(list.slice(-NEDAVNIE_LIMIT));
}

/** Последние попытки по набору прототипов (например, группы), свежие первыми. */
export function poslednie8(
  list: readonly Popytka8[],
  prototypes: readonly string[],
  n = 5,
): Popytka8[] {
  const own = list.filter((p) => prototypes.includes(p.k));
  return own.slice(-n).reverse();
}

/** Стоит ли повторить: из последних пяти попыток две и больше неверных. */
export function stoitPovtorit8(list: readonly Popytka8[], prototypes: readonly string[]): boolean {
  return poslednie8(list, prototypes).filter((p) => !p.r).length >= 2;
}

/* ── Закладки «Отложить на потом»: идентификаторы задач ─────────── */

const ZAKLADKI_EMPTY: string[] = [];

export const zakladki8 = createJsonStore<string[]>(
  'budetege:vychisleniya-8:zakladki:v1',
  ZAKLADKI_EMPTY,
  (value) =>
    Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : null,
);

export function toggleZakladka8(taskId: string): void {
  const list = zakladki8.read();
  zakladki8.write(list.includes(taskId) ? list.filter((id) => id !== taskId) : [...list, taskId]);
}

/* ── Последний выбор тренировки ──────────────────────────────────── */

export interface Vybor8 {
  /** Выбранные типы (прототипы). Пусто — все. */
  tipy: string[];
  /** Сколько задач; null — без конца. */
  count: number | null;
  timer: boolean;
  /** Без подсказок и решений до итогов. */
  bezPodskazok: boolean;
}

export const VYBOR8_DEFAULT: Vybor8 = { tipy: [], count: 10, timer: true, bezPodskazok: false };

export const vybor8 = createJsonStore<Vybor8>(
  'budetege:vychisleniya-8:vybor:v1',
  VYBOR8_DEFAULT,
  (value) => {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const v = value as Partial<Vybor8>;
    return {
      tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
      count: v.count === null ? null : typeof v.count === 'number' && v.count > 0 ? v.count : 10,
      timer: v.timer !== false,
      bezPodskazok: v.bezPodskazok === true,
    };
  },
);

/* ── Подготовка: блок → номера решённых задач ────────────────── */

export const PREP8_KEY = 'budetege:vychisleniya-8:prep:v1';

export type Prep8Progress = Record<string, number[]>;

const EMPTY: Prep8Progress = {};
let cache: Prep8Progress | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): Prep8Progress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const out: Prep8Progress = {};
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

function snapshot(): Prep8Progress {
  if (cache === null) {
    try {
      cache = parse(window.localStorage.getItem(PREP8_KEY));
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function serverSnapshot(): Prep8Progress {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === PREP8_KEY || event.key === null) {
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

export function usePrep8Progress(): Prep8Progress {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function prep8Solved(progress: Prep8Progress, block: string, total: number): number {
  return (progress[block] ?? []).filter((no) => no >= 1 && no <= total).length;
}

export function prep8IsSolved(progress: Prep8Progress, block: string, no: number): boolean {
  return (progress[block] ?? []).includes(no);
}

export function prep8MarkSolved(block: string, no: number): void {
  const current = snapshot();
  if ((current[block] ?? []).includes(no)) {
    return;
  }
  const next: Prep8Progress = {
    ...current,
    [block]: [...(current[block] ?? []), no].sort((a, b) => a - b),
  };
  cache = next;
  try {
    window.localStorage.setItem(PREP8_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — прогресс живёт до перезагрузки. */
  }
  listeners.forEach((fn) => fn());
}
