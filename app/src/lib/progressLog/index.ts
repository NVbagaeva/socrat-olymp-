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
  isEmptyLog,
  newAttemptId,
  parseLog,
  type LogAttempt,
  type ProgressLog,
} from './model';

export * from './model';
export * from './sovmestimost';

/** Журнал → ключ прежнего формата. Синхронизация сворачивает их до слияния с аккаунтом. */
export const LEGACY_LOGS: Record<string, string> = {
  'budetege:vychisleniya-8:log:v1': 'budetege:vychisleniya-8:v1',
  /* №3: счётчики по прототипам и список ошибок прежнего тренажёра. */
  'budetege:zadanie-3:log:v1': 'budetege:z3:trainer:v1',
  /* Разделы, переведённые со счётчиков lib/progressStore.ts: счётчики по
     типам, список ошибок и исходы задач. Прежние ключи не удаляются. */
  'budetege:planimetriya-1:log:v1': 'budetege:planimetriya-1:v1',
  'budetege:vektory-2:log:v1': 'budetege:vektory-2:v1',
  'budetege:veroyatnost-4:log:v1': 'budetege:veroyatnost-4:v2',
  'budetege:veroyatnost-5:log:v1': 'budetege:veroyatnost-5:v2',
  'budetege:zadanie-6:log:v1': 'budetege:zadanie-6:v1',
  'budetege:zadanie-7:log:v1': 'budetege:zadanie-7:v1',
  'budetege:proizvodnaya-9:log:v1': 'budetege:proizvodnaya-9:v1',
  'budetege:zadanie-11:log:v1': 'budetege:zadanie-11:v1',
  'budetege:zadanie-13:log:v1': 'budetege:zadanie-13:v1',
  'budetege:zadanie-14:log:v1': 'budetege:zadanie-14:v1',
  'budetege:zadanie-18:log:v1': 'budetege:zadanie-18:trenazher:v1',
  /* №12: общее хранилище lib/trainerProgress.ts (счётчики всех разделов
     №12, ошибки, решённые задачи). */
  'budetege:zadanie-12:log:v1': 'budetege:trainer:v1',
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
    if (isEmptyLog(log)) {
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
        addAttempt(log, {
          ...attempt,
          /* Длинные идентификаторы режутся, а не теряются при разборе. */
          task: attempt.task.slice(0, 120),
          kind: attempt.kind.slice(0, 40),
          id: newAttemptId(),
          at: attempt.at ?? Date.now(),
        }),
      );
    },
    /* Сброс пишет пустой журнал, а не стирает ключ: иначе после
       перезагрузки счётчики прежнего формата свернулись бы в журнал заново. */
    reset() {
      migrated = true;
      base.set(EMPTY_LOG);
    },
  };
}
