'use client';

/**
 * Прогресс опорных задач №3: исходы задач по блокам. Отдельный ключ —
 * тренажёр №3 и опорные задачи не мешают друг другу.
 */

import { createProgressStore, type StoreProgress } from '../../progressStore';

export const opornye3 = createProgressStore('budetege:zadanie-3:opornye:v1');

export function itog3(progress: StoreProgress, id: string) {
  return progress.outcomes[id] ?? null;
}

/** Записать исход задачи. Верное решение снимает прежнюю ошибку. */
export function zapisat3(blok: string, id: string, itog: 'right' | 'wrong' | 'revealed'): void {
  opornye3.recordAttempt({
    kind: blok,
    taskId: id,
    right: itog === 'right',
    clean: itog === 'right',
    seconds: 0,
    itog,
  });
}
