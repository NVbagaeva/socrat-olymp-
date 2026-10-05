'use client';

/**
 * Хранилища прогресса задания №2: тренажёр и тренировки навыков.
 *
 * Оба — общая фабрика lib/progressStore.ts со своими ключами: сброс
 * здесь не трогает другие задания. Ответов в хранилищах нет: счётчики,
 * идентификаторы задач и чем каждая закрылась.
 *
 * Кольцо в шапке раздела складывает действия ученика: прочитанные
 * разделы теории (lib/theoryRead, ключ «2»), решённые микрозадачи
 * тренировок навыков и закрытые задачи тренажёра. Пустые вкладки в
 * сумму не входят — считается только то, что на сайте есть.
 */

import { PROGRESS_2 } from '@/content/vektory';
import { createProgressStore, type StoreProgress } from '../progressStore';

/** Тренажёр: счётчики по прототипам и список ошибок. */
export const progress2 = createProgressStore('budetege:vektory-2:v1');

/** Тренировки навыков: исход каждой микрозадачи. */
export const opornye2 = createProgressStore('budetege:vektory-2:opornye:v1');

/** Ключ прочитанных разделов теории в lib/theoryRead. */
export const TEORIYA_KEY_2 = PROGRESS_2.teoriyaKey;

export function mikroId(blok: string, no: number): string {
  return `${blok}:${no}`;
}

/** Сколько микрозадач блока решено верно. */
export function mikroResheno(progress: StoreProgress, blok: string, total: number): number {
  let n = 0;
  for (let no = 1; no <= total; no += 1) {
    if (progress.outcomes[mikroId(blok, no)] === 'right') n += 1;
  }
  return n;
}

/** Чем закрылась микрозадача; null — не открывалась. */
export function mikroItog(progress: StoreProgress, blok: string, no: number) {
  return progress.outcomes[mikroId(blok, no)] ?? null;
}

/** Записать исход микрозадачи. Верное решение снимает прежнюю ошибку. */
export function mikroZapisat(blok: string, no: number, itog: 'right' | 'wrong' | 'revealed'): void {
  opornye2.recordAttempt({
    kind: blok,
    taskId: mikroId(blok, no),
    right: itog === 'right',
    clean: itog === 'right',
    seconds: 0,
    itog,
  });
}
