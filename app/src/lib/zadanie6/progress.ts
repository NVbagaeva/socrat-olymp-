'use client';

/**
 * Хранилища прогресса задания №6: тренажёр и опорные задачи — общая
 * фабрика lib/progressStore.ts со своими ключами. Прочитанные разделы
 * теории — lib/theoryRead, ключ PROGRESS_6.teoriyaKey.
 */

import { createProgressStore } from '../progressStore';

/** Тренажёр: счётчики по прототипам и список ошибок. */
export const trenazher6 = createProgressStore('budetege:zadanie-6:v1');

/** Опорные задачи: исход каждой микрозадачи. */
export const opornye6 = createProgressStore('budetege:zadanie-6:opornye:v1');
