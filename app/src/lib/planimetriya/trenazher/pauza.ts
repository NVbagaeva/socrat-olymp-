'use client';

/**
 * Тренировка на паузе: начатая тренировка №1 переживает уход со
 * страницы и перезагрузку (localStorage).
 *
 * Хранится только план — ссылки на задачи (номер банка, аналога или
 * seed новой задачи), — номер текущей задачи и отметки решённых.
 * Ответов здесь нет: задачи по плану собираются заново тем же
 * детерминированным движком (trenazher/zadacha.ts), ответ снова
 * закрывается отпечатком. «Поставить на паузу» сохраняет и уводит к
 * выбору, «Продолжить» возвращает к той же задаче, «Завершить
 * тренировку» подводит итог и стирает запись.
 */

import { useSyncExternalStore } from 'react';
import type { ZadachaPlan } from './sessiya';

const KEY = 'budetege:planimetriya-1:trenazher-pauza:v1';

export type Otmetka = 'right' | 'hinted' | 'wrong';

export interface Pauza {
  plan: ZadachaPlan[];
  podskazki: boolean;
  /** Текущая задача. */
  index: number;
  /** Отметки по задачам; null — ещё не закрыта. */
  otmetki: (Otmetka | null)[];
  /** Когда начата тренировка, мс. */
  nachato: number;
}

const listeners = new Set<() => void>();
let current: Pauza | null | undefined;

function planOk(x: unknown): x is ZadachaPlan {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Record<string, unknown>;
  if (typeof p.id !== 'string' || !/^p\d{2}$/.test(p.id)) return false;
  if (p.vid === 'new') return typeof p.seed === 'string';
  return (p.vid === 'bank' || p.vid === 'analog') && typeof p.no === 'number';
}

function razobrat(raw: string | null): Pauza | null {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw) as Partial<Pauza>;
    if (!Array.isArray(v.plan) || v.plan.length === 0 || !v.plan.every(planOk)) return null;
    const n = v.plan.length;
    const otmetki = Array.from({ length: n }, (_, i) => {
      const o = Array.isArray(v.otmetki) ? v.otmetki[i] : null;
      return o === 'right' || o === 'hinted' || o === 'wrong' ? o : null;
    });
    const index =
      typeof v.index === 'number' && v.index >= 0 && v.index < n ? Math.floor(v.index) : 0;
    return {
      plan: v.plan,
      podskazki: v.podskazki !== false,
      index,
      otmetki,
      nachato: typeof v.nachato === 'number' ? v.nachato : Date.now(),
    };
  } catch {
    return null;
  }
}

function snapshot(): Pauza | null {
  if (current === undefined) {
    try {
      current = razobrat(window.localStorage.getItem(KEY));
    } catch {
      current = null;
    }
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function uvedomit(): void {
  listeners.forEach((listener) => listener());
}

/** Запомнить состояние тренировки (каждый переход к задаче и отметка). */
export function zapomnitPauzu(p: Pauza): void {
  current = p;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* Приватный режим: пауза живёт до перезагрузки. */
  }
  uvedomit();
}

/** Тренировка завершена или брошена: записи больше нет. */
export function steretPauzu(): void {
  current = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* Нечего стирать. */
  }
  uvedomit();
}

export function usePauza(): Pauza | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** Сколько задач закрыто. */
export function zakryto(p: Pauza): number {
  return p.otmetki.filter((o) => o !== null).length;
}
