'use client';

/**
 * Подход тренажёра задания №3, пока ученик его решает.
 *
 * Порядок решает браузер и только после монтирования: перемешай мы
 * его на сборке — «случайный» порядок был бы у всех один и тот же,
 * а случайное число при отрисовке разошлось бы с разметкой сервера.
 *
 * Живёт в памяти вкладки. Переход между заданиями порядок не меняет,
 * «Начать заново» — меняет.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { type RoundItem } from './podhod';

const EMPTY: RoundItem[] = [];

const rounds = new Map<string, RoundItem[]>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Подход для этого режима. Пока не собран — пустой список. */
export function useZ3Round(key: string, build: () => RoundItem[]): RoundItem[] {
  const read = useCallback(() => {
    const found = rounds.get(key);
    if (found !== undefined) {
      return found;
    }
    const made = build();
    rounds.set(key, made);
    return made;
  }, [key, build]);

  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Собрать подход заново: другие задания и другой порядок. */
export function restartZ3Round(key: string): void {
  rounds.delete(key);
  listeners.forEach((fn) => fn());
}

/** Заменить одно задание подхода: «ещё один вариант». */
export function swapZ3Task(key: string, at: number, item: RoundItem): void {
  const found = rounds.get(key);
  if (found === undefined) {
    return;
  }
  const next = [...found];
  next[at] = item;
  rounds.set(key, next);
  listeners.forEach((fn) => fn());
}
