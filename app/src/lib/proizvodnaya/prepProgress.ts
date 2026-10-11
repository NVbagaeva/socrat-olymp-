'use client';

/**
 * Прогресс опорных задач №9: блок → номера решённых микрозадач.
 * Ключ PREP9_KEY — из progress.ts, чтобы «Сбросить» в тренажёре не
 * трогал другие задания. Ответов в хранилище нет, только номера.
 * Устройство то же, что prep8* в lib/vychisleniya/progress.ts.
 */

import { useSyncExternalStore } from 'react';
import { PREP9_KEY } from './progress';

export type Prep9Progress = Record<string, number[]>;

const EMPTY: Prep9Progress = {};
let cache: Prep9Progress | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): Prep9Progress {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const out: Prep9Progress = {};
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

function snapshot(): Prep9Progress {
  if (cache === null) {
    try {
      cache = parse(window.localStorage.getItem(PREP9_KEY));
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function serverSnapshot(): Prep9Progress {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === PREP9_KEY || event.key === null) {
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

export function usePrep9Progress(): Prep9Progress {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function prep9Solved(progress: Prep9Progress, block: string, total: number): number {
  return (progress[block] ?? []).filter((no) => no >= 1 && no <= total).length;
}

export function prep9IsSolved(progress: Prep9Progress, block: string, no: number): boolean {
  return (progress[block] ?? []).includes(no);
}

export function prep9MarkSolved(block: string, no: number): void {
  const current = snapshot();
  if ((current[block] ?? []).includes(no)) {
    return;
  }
  const next: Prep9Progress = {
    ...current,
    [block]: [...(current[block] ?? []), no].sort((a, b) => a - b),
  };
  cache = next;
  try {
    window.localStorage.setItem(PREP9_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно — прогресс живёт до перезагрузки. */
  }
  listeners.forEach((fn) => fn());
}
