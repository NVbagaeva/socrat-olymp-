'use client';

/**
 * Хранилища прогресса задания №7: тренажёр и опорные задачи — общая
 * фабрика lib/progressStore.ts со своими ключами. Тренажёр копит
 * счётчики по прототипам (P01 …). Прочитанные разделы теории —
 * lib/theoryRead, ключ PROGRESS_7.teoriyaKey.
 */

import { createProgressStore } from '../progressStore';

/** Тренажёр: счётчики по прототипам и список ошибок. */
export const trenazher7 = createProgressStore('budetege:zadanie-7:v1');

/** Опорные задачи: исход каждой микрозадачи. */
export const opornye7 = createProgressStore('budetege:zadanie-7:opornye:v1');
