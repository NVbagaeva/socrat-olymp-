'use client';

/**
 * Хранилища прогресса №14: опорные задачи и тренажёр — общая фабрика
 * lib/progressStore.ts со своими ключами. Прочитанные пункты теории —
 * lib/theoryRead, ключ PROGRESS_14.teoriyaKey.
 */

import { createProgressStore } from '../progressStore';

export const opornye14 = createProgressStore('budetege:zadanie-14:opornye:v1');
export const trenazher14 = createProgressStore(
  'budetege:zadanie-14:v1',
  'budetege:zadanie-14:log:v1',
);
