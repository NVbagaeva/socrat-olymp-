'use client';

/**
 * Хранилища прогресса задания №1: тренировки навыков (и тренажёр —
 * с PR3). Общая фабрика lib/progressStore.ts со своими ключами: сброс
 * здесь не трогает другие задания. Ответов в хранилищах нет.
 */

import { createProgressStore, type StoreProgress } from '../progressStore';

/** Тренажёр: счётчики по прототипам. */
export const progress1 = createProgressStore('budetege:planimetriya-1:v1');

/** Тренировки навыков: исход каждой микрозадачи. */
export const opornye1 = createProgressStore('budetege:planimetriya-1:opornye:v1');

/** Ключ прочитанных разделов теории в lib/theoryRead. */
export const TEORIYA_KEY_1 = '1';

export function mikroId(blok: string, no: number): string {
  return `${blok}:${no}`;
}

export function mikroResheno(progress: StoreProgress, blok: string, total: number): number {
  let n = 0;
  for (let no = 1; no <= total; no += 1) {
    if (progress.outcomes[mikroId(blok, no)] === 'right') n += 1;
  }
  return n;
}

export function mikroItog(progress: StoreProgress, blok: string, no: number) {
  return progress.outcomes[mikroId(blok, no)] ?? null;
}

export function mikroZapisat(blok: string, no: number, itog: 'right' | 'wrong' | 'revealed'): void {
  opornye1.recordAttempt({
    kind: blok,
    taskId: mikroId(blok, no),
    right: itog === 'right',
    clean: itog === 'right',
    seconds: 0,
    itog,
  });
}
