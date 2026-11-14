'use client';

/**
 * Хранилище опорных задач №11 — общая фабрика lib/progressStore.ts со
 * своим ключом. Журнал тренажёра — trening/progress.ts. Прочитанные
 * разделы теории — lib/theoryRead,
 * ключ PROGRESS_11.teoriyaKey.
 */

import { PROGRESS_11 } from '@/content/zadanie11';
import { createProgressStore, type StoreProgress } from '../progressStore';

/* Тренажёр пишет в общий журнал попыток: lib/zadanie11/trening/progress.ts
   (log11, ключ budetege:zadanie-11:log:v1; прежний budetege:zadanie-11:v1
   сворачивается в него при первом чтении). */

/** Опорные задачи: исход каждой микрозадачи. */
export const opornye11 = createProgressStore('budetege:zadanie-11:opornye:v1');

export const TEORIYA_KEY_11 = PROGRESS_11.teoriyaKey;

export function mikroId11(blok: string, no: number): string {
  return `${blok}:${no}`;
}

/** Сколько микрозадач блока решено верно. */
export function mikroResheno11(progress: StoreProgress, blok: string, total: number): number {
  let n = 0;
  for (let no = 1; no <= total; no += 1) {
    if (progress.outcomes[mikroId11(blok, no)] === 'right') n += 1;
  }
  return n;
}

/** Чем закрылась микрозадача; null — не открывалась. */
export function mikroItog11(progress: StoreProgress, blok: string, no: number) {
  return progress.outcomes[mikroId11(blok, no)] ?? null;
}

/** Записать исход микрозадачи. Верное решение снимает прежнюю ошибку. */
export function mikroZapisat11(
  blok: string,
  no: number,
  itog: 'right' | 'wrong' | 'revealed',
): void {
  opornye11.recordAttempt({
    kind: blok,
    taskId: mikroId11(blok, no),
    right: itog === 'right',
    clean: itog === 'right',
    seconds: 0,
    itog,
  });
}
