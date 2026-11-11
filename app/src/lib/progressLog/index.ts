'use client';

/**
 * Журнал попыток раздела в localStorage (модель — ./model.ts).
 *
 * Раздел заводит своё хранилище одной строкой:
 *   createLogStore('budetege:vychisleniya-8:log:v1', 'budetege:vychisleniya-8:v1')
 * Второй ключ — хранилище прежнего формата (lib/progressStore.ts): при
 * первом чтении его счётчики и ошибки сворачиваются в журнал, а сам он
 * остаётся как был (на случай отката сайта).
 */

import { browserStorage } from '@/lib/storage';
import { createSyncedStore, type SyncedStore } from '@/lib/syncedStore';
import {
  EMPTY_LOG,
  addAttempt,
  fromLegacy,
  newAttemptId,
  parseLog,
  type LogAttempt,
  type ProgressLog,
} from './model';

export * from './model';

/** Журнал → ключ прежнего формата. Синхронизация сворачивает их до слияния с аккаунтом. */
export const LEGACY_LOGS: Record<string, string> = {
  'budetege:vychisleniya-8:log:v1': 'budetege:vychisleniya-8:v1',
};

/**
 * Свернуть хранилище прежнего формата в журнал, если журнала на этом
 * устройстве ещё нет. Вызывается при первом чтении и синхронизацией.
 */
export function migrateLegacyLog(key: string): void {
  const legacy = LEGACY_LOGS[key];
  const target = browserStorage();
  if (legacy === undefined || target === null) return;
  try {
    if (target.getItem(key) !== null) return;
    const raw = target.getItem(legacy);
    if (raw === null) return;
    const log = fromLegacy(JSON.parse(raw), `ustroystvo-${newAttemptId()}`);
    if (
      log.attempts.length === 0 &&
      Object.keys(log.archive).length === 0 &&
      log.legacyMistakes.length === 0
    ) {
      return;
    }
    target.setItem(key, JSON.stringify(log));
  } catch {
    /* Испорченная запись прежнего формата — начинаем с пустого журнала. */
  }
}

export function migrateAllLegacyLogs(): void {
  Object.keys(LEGACY_LOGS).forEach(migrateLegacyLog);
}

export interface LogStore extends SyncedStore<ProgressLog> {
  /** Записать закрытую задачу. */
  record(attempt: Omit<LogAttempt, 'id' | 'at'> & { at?: number }): void;
}

export function createLogStore(key: string): LogStore {
  let migrated = false;
  const base = createSyncedStore<ProgressLog>(key, parseLog, EMPTY_LOG);
  const ensure = () => {
    if (!migrated && typeof window !== 'undefined') {
      migrated = true;
      migrateLegacyLog(key);
    }
  };
  return {
    ...base,
    get() {
      ensure();
      return base.get();
    },
    use() {
      ensure();
      return base.use();
    },
    record(attempt) {
      ensure();
      base.update((log) =>
        addAttempt(log, { ...attempt, id: newAttemptId(), at: attempt.at ?? Date.now() }),
      );
    },
  };
}
