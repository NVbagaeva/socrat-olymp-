'use client';

/**
 * Хранилища прогресса задания №11: тренажёр и опорные задачи — общая
 * фабрика lib/progressStore.ts со своими ключами. Тренажёр копит
 * счётчики по подтипам (DP-07 …), по ним считается «решено N%»
 * на карте разделов. Прочитанные разделы теории — lib/theoryRead,
 * ключ PROGRESS_11.teoriyaKey.
 */

import { PROGRESS_11 } from '@/content/zadanie11';
import { createProgressStore } from '../progressStore';

/** Тренажёр: счётчики по подтипам и список ошибок. */
export const trenazher11 = createProgressStore('budetege:zadanie-11:v1');

/** Опорные задачи: исход каждой микрозадачи. */
export const opornye11 = createProgressStore('budetege:zadanie-11:opornye:v1');

export const TEORIYA_KEY_11 = PROGRESS_11.teoriyaKey;
