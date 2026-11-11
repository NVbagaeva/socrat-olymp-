'use client';

/**
 * Хранилища прогресса задания №8: тренажёр и опорные задачи.
 *
 * Тренажёр — журнал попыток (lib/progressLog): из него считаются
 * прогресс по типам, «Стоит повторить», «Мои ошибки» и число решённых
 * задач банка. Прежний ключ budetege:vychisleniya-8:v1 (счётчики)
 * сворачивается в журнал при первом чтении.
 *
 * Оба хранилища — synced (lib/syncedStore): со входом их содержимое
 * живёт и в аккаунте и сливается между устройствами (lib/accountSync).
 * Ответов здесь нет: идентификаторы задач и исходы.
 */

import { createLogStore } from '../progressLog';
import { createSyncedStore } from '../syncedStore';

/** Журнал тренажёра №8. */
export const PROGRESS8_KEY = 'budetege:vychisleniya-8:log:v1';
export const log8 = createLogStore(PROGRESS8_KEY);

/* ── Опорные задачи: блок → номера решённых задач ────────────── */

export const PREP8_KEY = 'budetege:vychisleniya-8:prep:v1';

export type Prep8Progress = Record<string, number[]>;

const EMPTY: Prep8Progress = {};

function parsePrep(value: unknown): Prep8Progress {
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
}

export const prep8 = createSyncedStore<Prep8Progress>(PREP8_KEY, parsePrep, EMPTY);

/** Слить решённое двух устройств: объединение номеров по блокам. */
export function mergePrep(a: Prep8Progress, b: Prep8Progress): Prep8Progress {
  const out: Prep8Progress = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[id] = [...new Set([...(a[id] ?? []), ...(b[id] ?? [])])].sort((x, y) => x - y);
  }
  return out;
}

export function usePrep8Progress(): Prep8Progress {
  return prep8.use();
}

export function prep8Solved(progress: Prep8Progress, block: string, total: number): number {
  return (progress[block] ?? []).filter((no) => no >= 1 && no <= total).length;
}

export function prep8IsSolved(progress: Prep8Progress, block: string, no: number): boolean {
  return (progress[block] ?? []).includes(no);
}

export function prep8MarkSolved(block: string, no: number): void {
  const current = prep8.get();
  if ((current[block] ?? []).includes(no)) {
    return;
  }
  prep8.set({ ...current, [block]: [...(current[block] ?? []), no].sort((a, b) => a - b) });
}

/* ── Последний выбор тренировки: типы, число задач, таймер, без подсказок ── */

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

function parseVybor(value: unknown): Vybor8 {
  if (typeof value !== 'object' || value === null) {
    return VYBOR8_DEFAULT;
  }
  const v = value as Partial<Vybor8>;
  return {
    tipy: Array.isArray(v.tipy) ? v.tipy.filter((x): x is string => typeof x === 'string') : [],
    count: v.count === null ? null : typeof v.count === 'number' && v.count > 0 ? v.count : 10,
    timer: v.timer !== false,
    bezPodskazok: v.bezPodskazok === true,
  };
}

/** Последний выбор на вкладке «Тренажёр»: со входом — и в аккаунте. */
export const vybor8 = createSyncedStore<Vybor8>(
  'budetege:vychisleniya-8:vybor:v1',
  parseVybor,
  VYBOR8_DEFAULT,
);
