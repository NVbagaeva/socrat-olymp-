'use client';

/**
 * Прогресс подготовительных задач заданий №4 и №5.
 *
 * Своё хранилище на задание: «Сбросить» в одном разделе не трогает
 * другой, а с прогрессом подготовки задания №12 они не смешиваются
 * вовсе — у того свой ключ и свой формат.
 *
 * Внутри — тот же склад, что у тренажёра вероятности
 * (`createProgressStore`), только набором считается не прототип,
 * а сама задача. Исход каждой задачи хранилище помнит отдельно
 * (`outcomes`): верно, неверно или разобрано решение — поэтому после
 * перезагрузки кружок того же цвета, каким был.
 *
 * Ответов в хранилище нет — только идентификаторы задач и счётчики.
 */

import type { Zadanie } from '@/content/veroyatnost';
import {
  createProgressStore,
  type ProgressStore,
  type StoreProgress,
  type TaskOutcome,
} from '../progressStore';

const STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4:prep:v1'),
  5: createProgressStore('budetege:veroyatnost-5:prep:v1'),
};

/** Хранилище подготовки этого задания. */
export function prepStore(zadanie: Zadanie): ProgressStore {
  return STORES[zadanie];
}

/**
 * Чем закрылась задача. Нет записи — её не открывали.
 *
 * Счётчик `right` смотрится заодно: записи, сделанные до появления
 * исходов, помнят только его, и решённое в них не должно потеряться.
 */
export function prepItog(progress: StoreProgress, id: string): TaskOutcome | null {
  if ((progress.kinds[id]?.right ?? 0) > 0) {
    return 'right';
  }
  return progress.outcomes[id] ?? null;
}

/** Решена ли задача: был верный ответ своими силами. */
export function prepReshena(progress: StoreProgress, id: string): boolean {
  return prepItog(progress, id) === 'right';
}

/** Сколько задач блока решено. */
export function prepResheno(progress: StoreProgress, ids: readonly string[]): number {
  return ids.filter((id) => prepReshena(progress, id)).length;
}
