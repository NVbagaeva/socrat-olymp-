'use client';

/**
 * Хранилища прогресса задания №13: тренажёр и опорные задачи — общая
 * фабрика lib/progressStore.ts со своими ключами. Исход задачи блока
 * хранится под постоянным id задачи («o13-04-07», opornye/sostav.ts);
 * записи под прежним ключом «блок:номер» читаются как раньше. Задачи
 * тренажёра — под «прототип|seed».
 */

import { createProgressStore, type StoreProgress } from '../progressStore';
import { SOSTAV_13 } from './opornye/sostav';

/** Тренажёр: счётчики по прототипам и список ошибок («A-01|b3»). */
export const trenazher13 = createProgressStore(
  'budetege:zadanie-13:v1',
  'budetege:zadanie-13:log:v1',
);

/** Опорные задачи: исход каждой задачи блока. */
export const opornye13 = createProgressStore('budetege:zadanie-13:opornye:v1');

/** Постоянный id задачи блока по её номеру в блоке. */
export function zadachaId13(blok: string, no: number): string {
  return SOSTAV_13[blok]?.[no - 1]?.[0] ?? `${blok}:${no}`;
}

/** Прежний ключ задачи блока: так прогресс хранился до постоянных id. */
export function staryyKlyuch13(blok: string, no: number): string {
  return `${blok}:${no}`;
}

/** Прежний ключ по постоянному id: «o13-04-07» → «o13-04:7». */
export function staryyKlyuchPoId13(id: string): string | null {
  const m = /^(o13-\d{2})-(\d{2})$/.exec(id);
  return m === null ? null : `${m[1]}:${Number(m[2])}`;
}

/** Чем закрылась задача; null — не открывалась. Сначала — запись под id, потом прежняя. */
export function itog13(progress: StoreProgress, blok: string, no: number) {
  return (
    progress.outcomes[zadachaId13(blok, no)] ?? progress.outcomes[staryyKlyuch13(blok, no)] ?? null
  );
}

/** Сколько задач блока решено верно. */
export function resheno13(progress: StoreProgress, blok: string, total: number): number {
  let n = 0;
  for (let no = 1; no <= total; no += 1) {
    if (itog13(progress, blok, no) === 'right') n += 1;
  }
  return n;
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
