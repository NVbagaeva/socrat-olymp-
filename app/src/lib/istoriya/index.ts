'use client';

/** История тренировок в localStorage (модель — ./model.ts). Одна на все тренажёры. */

import { createSyncedStore } from '@/lib/syncedStore';
import { EMPTY_HISTORY, addHistory, parseHistory, type HistoryEntry } from './model';

export * from './model';

export const HISTORY_KEY = 'budetege:istoriya:v1';

export const history = createSyncedStore(HISTORY_KEY, parseHistory, EMPTY_HISTORY);

export function recordHistory(entry: HistoryEntry): void {
  history.update((list) => addHistory(list, entry));
}
