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
  const next: Prep8Progress = { ...current, [block]: [...(current[block] ?? []), no].sort((a, b) => a - b) };
  cache = next;
  try {
    window.localStorage.setItem(PREP8_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — прогресс живёт до перезагрузки. */
  }
  listeners.forEach((fn) => fn());
}
