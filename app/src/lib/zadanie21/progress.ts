'use client';

/**
 * Прогресс опорных задач раздела: исход каждой задачи блока. Synced: со
 * входом — ещё и в аккаунте (lib/progressImport/registry.ts).
 */

import { createProgressStore } from '@/lib/progressStore';

export const OPORNYE21_KEY = 'budetege:zadanie-21:opornye:v1';
export const opornye21 = createProgressStore(OPORNYE21_KEY);
