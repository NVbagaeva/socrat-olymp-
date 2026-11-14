'use client';

/**
 * Прогресс опорных задач №18: отметка ученика «Решил» / «Не решил» у
 * каждой задачи. Общая фабрика lib/progressStore.ts со своим ключом —
 * как у опорных задач №13; хранится только в браузере (localStorage),
 * сброс не трогает другие хранилища.
 */

import { createProgressStore, type StoreProgress } from '@/lib/progressStore';

export const opornye18 = createProgressStore('budetege:zadanie-18:opornye:v1');

export type Otmetka18 = 'right' | 'wrong';

/** Отметка задачи; null — ещё не отмечена. */
export function otmetka18(progress: StoreProgress, id: string): Otmetka18 | null {
  const v = progress.outcomes[id];
  return v === 'right' || v === 'wrong' ? v : null;
}

/** Записать отметку. «Решил» снимает задачу из списка ошибочных. */
export function otmetit18(id: string, otmetka: Otmetka18): void {
  opornye18.recordAttempt({
    kind: 'opornye-18',
    taskId: id,
    right: otmetka === 'right',
    clean: otmetka === 'right',
    seconds: 0,
    itog: otmetka,
  });
}

/** Сколько задач из списка отмечено «Решил». */
export function resheno18(progress: StoreProgress, ids: readonly string[]): number {
  return ids.filter((id) => otmetka18(progress, id) === 'right').length;
}
