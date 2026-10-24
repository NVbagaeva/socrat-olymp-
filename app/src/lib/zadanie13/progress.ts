'use client';

/**
 * Хранилище прогресса задания №13: опорные задачи — общая фабрика
 * lib/progressStore.ts со своим ключом. Исход каждой задачи блока
 * хранится под «блок:номер».
 */

import { createProgressStore, type StoreProgress } from '../progressStore';

/** Опорные задачи: исход каждой задачи блока. */
export const opornye13 = createProgressStore('budetege:zadanie-13:opornye:v1');

export function zadachaId13(blok: string, no: number): string {
  return `${blok}:${no}`;
}

/** Сколько задач блока решено верно. */
export function resheno13(progress: StoreProgress, blok: string, total: number): number {
  let n = 0;
  for (let no = 1; no <= total; no += 1) {
    if (progress.outcomes[zadachaId13(blok, no)] === 'right') n += 1;
  }
  return n;
}

/** Чем закрылась задача; null — не открывалась. */
export function itog13(progress: StoreProgress, blok: string, no: number) {
  return progress.outcomes[zadachaId13(blok, no)] ?? null;
}

/** Записать исход задачи. Верное решение снимает прежнюю ошибку. */
export function zapisat13(blok: string, no: number, itog: 'right' | 'wrong' | 'revealed'): void {
  opornye13.recordAttempt({
    kind: blok,
    taskId: zadachaId13(blok, no),
    right: itog === 'right',
    clean: itog === 'right',
    seconds: 0,
    itog,
  });
}
