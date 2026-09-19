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
 * а сама задача: так по счётчику `right` видно, решена ли она, и
 * зелёный кружок переживает перезагрузку. Список `mistakes` хранит
 * задачи, закрытые не начисто: с ошибкой или с открытым решением.
 *
 * Ответов в хранилище нет — только идентификаторы задач и счётчики.
 */

import type { Zadanie } from '@/content/veroyatnost';
import { createProgressStore, type ProgressStore } from '../progressStore';
import type { TrainerProgress } from '../trainerProgress';

const STORES: Record<Zadanie, ProgressStore> = {
  4: createProgressStore('budetege:veroyatnost-4:prep:v1'),
  5: createProgressStore('budetege:veroyatnost-5:prep:v1'),
};

/** Хранилище подготовки этого задания. */
export function prepStore(zadanie: Zadanie): ProgressStore {
  return STORES[zadanie];
}

/** Решена ли задача: был верный ответ своими силами. */
export function prepReshena(progress: TrainerProgress, id: string): boolean {
  return (progress.kinds[id]?.right ?? 0) > 0;
}

/** Задача бралась, но своими силами не закрыта: ошибка или разбор. */
export function prepTrudnaya(progress: TrainerProgress, id: string): boolean {
  return progress.mistakes.includes(id);
}

/** Сколько задач блока решено. */
export function prepResheno(progress: TrainerProgress, ids: readonly string[]): number {
  return ids.filter((id) => prepReshena(progress, id)).length;
}
