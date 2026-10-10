'use client';

/**
 * Хранилища прогресса задания №9: тренажёр и опорные задачи.
 *
 * Свои ключи, чтобы «Сбросить» здесь не трогал другие задания.
 * Ответов в хранилищах нет: счётчики и идентификаторы задач.
 */

import { createProgressStore } from '../progressStore';

/** Тренажёр: счётчики по прототипам и список ошибок. */
export const progress9 = createProgressStore('budetege:proizvodnaya-9:v1');

/** Опорные задачи: блок → номера решённых микрозадач. */
export const PREP9_KEY = 'budetege:proizvodnaya-9:prep:v1';
