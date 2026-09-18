'use client';

/**
 * Подход тренажёра задания №4, пока ученик его решает.
 *
 * Порядок собирает браузер и только после монтирования: перемешай мы
 * его на сборке — «случайный» порядок был бы у всех один и тот же,
 * а случайное число при отрисовке разошлось бы с разметкой сервера.
 *
 * Сама сборка подхода берётся из lib/zadanie3/podhod: модуль чистый,
 * про стереометрию в нём нет ни строчки (тип — это «идентификатор и
 * список номеров вариантов»), и у него есть свой автотест в CI.
 * Вторая копия этих же ста сорока строк разъехалась бы с первой —
 * поэтому здесь ссылка, а не копия. Задание №3 при этом не меняется.
 */

import { useCallback, useSyncExternalStore } from 'react';
import { buildRound, seeded, type RoundItem, type RoundKind } from '../zadanie3/podhod';

export { ROUND_SIZE, otherVariant, type RoundItem, type RoundKind } from '../zadanie3/podhod';

const EMPTY: RoundItem[] = [];

const rounds = new Map<string, RoundItem[]>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Зерно подхода берётся здесь, а не в компоненте при отрисовке. */
function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

/** Подход для этого режима. Пока не собран — пустой список. */
export function useVeroyatnostRound(key: string, source: RoundKind[], size: number): RoundItem[] {
  const read = useCallback(() => {
    const found = rounds.get(key);
    if (found !== undefined) {
      return found;
    }
    const made = buildRound(source, seeded(freshSeed()), size);
    rounds.set(key, made);
    return made;
  }, [key, source, size]);

  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Собрать подход заново: другие задания и другой порядок. */
export function restartRound(key: string): void {
  rounds.delete(key);
  listeners.forEach((fn) => fn());
}

/** Заменить одно задание подхода: «ещё один вариант». */
export function swapTask(key: string, at: number, item: RoundItem): void {
  const found = rounds.get(key);
  if (found === undefined) {
    return;
  }
  const next = [...found];
  next[at] = item;
  rounds.set(key, next);
  listeners.forEach((fn) => fn());
}
