'use client';

/**
 * Синхронизация прогресса с аккаунтом — между устройствами.
 *
 * Грузится только вошедшему (components/auth/AuthLive.tsx) и только при
 * включённом входе: гостю этот код не нужен, его сайт живёт в
 * localStorage, как раньше.
 *
 * Как устроено. Ключи из lib/progressImport/registry.ts лежат и в
 * браузере, и в аккаунте (таблица user_storage). Один проход
 * синхронизации:
 *   1. прочитать значения ключей в аккаунте;
 *   2. слить с браузерными по правилам ./merge.ts (журнал — объединением
 *      попыток, тренировка — более свежая и т. д.);
 *   3. записать слитое в браузер (экраны перечитают его по
 *      SYNC_APPLIED_EVENT) и в аккаунт — только то, что изменилось.
 * Проход запускается при входе на страницу, когда вкладка снова видна и
 * через пару секунд после любой записи прогресса на этом устройстве.
 *
 * Перед первым проходом на устройстве, где у гостя был прогресс, нужен
 * ответ на вопрос «Перенести ваш прогресс с этого устройства в кабинет?»
 * (кабинет, lib/progressImport). «Да» — прогресс сливается с аккаунтом.
 * «Нет» — прогресс гостя откладывается в сторону (ключи budetege-gost:…,
 * в аккаунт не уходят), и устройство дальше работает с данными аккаунта.
 *
 * Ученик младше 18 до согласия родителя в аккаунт не пишет (правило
 * базы): проход только читает.
 */

import { getClient } from '@/lib/auth/client';
import { currentUser } from '@/lib/auth/session';
import { importAnswer, localProgress, rememberImportAnswer } from '@/lib/progressImport';
import { LEGACY_LOGS, migrateAllLegacyLogs } from '@/lib/progressLog';
import { browserStorage } from '@/lib/storage';
import { LOCAL_CHANGE_EVENT, SYNC_APPLIED_EVENT } from '@/lib/syncedStore';
import { notifySessionsChanged } from '@/lib/trainerSession/store';
import { SYNCED_KEYS, finishedSessions, isSyncedKey, mergeValue } from './merge';

/** Ответ на вопрос о переносе дан: синхронизацию можно начинать. */
export const IMPORT_ANSWERED_EVENT = 'budetege:import-answered';

/** Куда откладывается прогресс гостя, если ответ «Нет». В аккаунт не уходит. */
const STASH_PREFIX = 'budetege-gost:';

/** Пауза после записи на устройстве: несколько записей подряд — один проход. */
const DEBOUNCE_MS = 2000;

const HISTORY_KEY = 'budetege:istoriya:v1';

function readLocal(key: string): unknown {
  try {
    const raw = browserStorage()?.getItem(key) ?? null;
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown): void {
  const target = browserStorage();
  if (target === null) return;
  try {
    if (value === null) target.removeItem(key);
    else target.setItem(key, JSON.stringify(value));
  } catch {
    /* Нет места — останется прежнее; следующий проход попробует снова. */
  }
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Можно ли синхронизировать этот аккаунт на этом устройстве. */
function ready(userId: string): boolean {
  if (importAnswer(userId) !== null) return true;
  /* Прогресса гостя нет — и спрашивать не о чем. */
  if (localProgress().length === 0) {
    rememberImportAnswer(userId, 'no');
    return true;
  }
  return false;
}

export interface SyncResult {
  /** Ключи, обновлённые в браузере. */
  pulled: string[];
  /** Ключи, записанные в аккаунт. */
  pushed: string[];
  /** Аккаунт отказал в записи (школьник до согласия родителя). */
  readOnly: boolean;
}

let running: Promise<SyncResult> | null = null;
let again = false;

/** Один проход синхронизации. Если проход уже идёт — после него ещё один. */
export function syncNow(): Promise<SyncResult> {
  if (running !== null) {
    again = true;
    return running;
  }
  running = pass().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

async function pass(): Promise<SyncResult> {
  const result: SyncResult = { pulled: [], pushed: [], readOnly: false };
  const user = currentUser();
  if (user === null || !ready(user.id)) return result;
  migrateAllLegacyLogs();

  const supabase = await getClient();
  const { data, error } = await supabase
    .from('user_storage')
    .select('key, value')
    .in('key', [...SYNCED_KEYS])
    .returns<{ key: string; value: unknown }[]>();
  if (error || data === null) return result;
  const server = new Map(data.map((row) => [row.key, row.value]));

  /* История — первой: по ней видно, какие тренировки уже завершены. */
  const order = [HISTORY_KEY, ...SYNCED_KEYS.filter((key) => key !== HISTORY_KEY)];
  let finished = new Set<string>();
  const upserts: { key: string; value: unknown }[] = [];
  const deletes: string[] = [];
  for (const key of order) {
    if (!SYNCED_KEYS.includes(key)) continue;
    const local = readLocal(key);
    const remote = server.has(key) ? server.get(key) : null;
    const merged = mergeValue(key, local, remote, finished);
    if (key === HISTORY_KEY) finished = finishedSessions(merged);
    if (!same(merged, local)) {
      writeLocal(key, merged);
      result.pulled.push(key);
    }
    if (!same(merged, remote)) {
      if (merged === null) deletes.push(key);
      else upserts.push({ key, value: merged });
    }
  }

  if (result.pulled.length > 0) {
    window.dispatchEvent(new CustomEvent(SYNC_APPLIED_EVENT, { detail: { keys: result.pulled } }));
    if (result.pulled.some((key) => key.startsWith('budetege:trainer:'))) notifySessionsChanged();
  }
  if (upserts.length > 0) {
    const { error: writeError } = await supabase
      .from('user_storage')
      .upsert(upserts, { onConflict: 'user_id,key' });
    if (writeError) result.readOnly = true;
    else result.pushed.push(...upserts.map((row) => row.key));
  }
  if (deletes.length > 0 && !result.readOnly) {
    const { error: deleteError } = await supabase.from('user_storage').delete().in('key', deletes);
    if (!deleteError) result.pushed.push(...deletes);
  }
  return result;
}

/**
 * «Нет» на вопрос о переносе: прогресс гостя — в сторону, на устройстве
 * дальше данные аккаунта. Отложенное не теряется: его можно перенести
 * позже кнопкой в кабинете (importStash).
 */
export function stashGuestProgress(userId: string): void {
  const target = browserStorage();
  if (target === null) return;
  migrateAllLegacyLogs();
  /* Прежние ключи — тоже в сторону: иначе следующий проход свернёт их в
     журнал заново и отправит прогресс гостя в аккаунт вопреки «Нет». */
  for (const key of [...SYNCED_KEYS, ...Object.values(LEGACY_LOGS)]) {
    try {
      const raw = target.getItem(key);
      if (raw === null) continue;
      target.setItem(`${STASH_PREFIX}${key}`, raw);
      target.removeItem(key);
    } catch {
      /* Не вышло отложить — значение останется и сольётся. Лучше так, чем потерять. */
    }
  }
  rememberImportAnswer(userId, 'no');
  window.dispatchEvent(new CustomEvent(SYNC_APPLIED_EVENT, { detail: { keys: [...SYNCED_KEYS] } }));
  notifySessionsChanged();
}

/** Есть ли отложенный прогресс гостя на этом устройстве. */
export function hasStash(): boolean {
  const target = browserStorage();
  if (target === null) return false;
  return SYNCED_KEYS.some((key) => {
    try {
      return target.getItem(`${STASH_PREFIX}${key}`) !== null;
    } catch {
      return false;
    }
  });
}

/** Перенести отложенный прогресс гостя в аккаунт: слить с текущим и синхронизировать. */
export async function importStash(): Promise<SyncResult> {
  const target = browserStorage();
  if (target !== null) {
    let finished = finishedSessions(readLocal(HISTORY_KEY));
    for (const key of [HISTORY_KEY, ...SYNCED_KEYS.filter((k) => k !== HISTORY_KEY)]) {
      try {
        const raw = target.getItem(`${STASH_PREFIX}${key}`);
        if (raw === null) continue;
        const merged = mergeValue(key, readLocal(key), JSON.parse(raw) as unknown, finished);
        if (key === HISTORY_KEY) finished = finishedSessions(merged);
        writeLocal(key, merged);
        target.removeItem(`${STASH_PREFIX}${key}`);
      } catch {
        /* Испорченное отложенное — пропускаем. */
      }
    }
    /* Прежние ключи возвращаются на место как были (на случай отката):
       журнал из них уже свёрнут и слит, второй раз он не сворачивается. */
    for (const legacy of Object.values(LEGACY_LOGS)) {
      try {
        const raw = target.getItem(`${STASH_PREFIX}${legacy}`);
        if (raw === null) continue;
        if (target.getItem(legacy) === null) target.setItem(legacy, raw);
        target.removeItem(`${STASH_PREFIX}${legacy}`);
      } catch {
        /* Не вышло вернуть — прежний ключ нужен только для отката. */
      }
    }
    window.dispatchEvent(
      new CustomEvent(SYNC_APPLIED_EVENT, { detail: { keys: [...SYNCED_KEYS] } }),
    );
  }
  return syncNow();
}

/* ── Ответ на вопрос о переносе ──────────────────────────────── */

/** «Да»: прогресс устройства сливается с аккаунтом. */
export async function acceptImport(userId: string): Promise<SyncResult> {
  rememberImportAnswer(userId, 'yes');
  const result = await syncNow();
  window.dispatchEvent(new Event(IMPORT_ANSWERED_EVENT));
  return result;
}

/** «Нет»: прогресс гостя — в сторону, устройство работает с данными аккаунта. */
export function refuseImport(userId: string): void {
  stashGuestProgress(userId);
  window.dispatchEvent(new Event(IMPORT_ANSWERED_EVENT));
}

/* ── Запуск ──────────────────────────────────────────────────── */

let stopCurrent: (() => void) | null = null;

/**
 * Включить синхронизацию для вошедшего. Возвращает выключатель. Пока на
 * устройстве не дан ответ о переносе прогресса, ждёт его.
 */
export function startAccountSync(): () => void {
  stopCurrent?.();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void syncNow().catch(() => {});
    }, DEBOUNCE_MS);
  };
  const onLocal = (event: Event) => {
    const key = (event as CustomEvent<{ key?: string }>).detail?.key;
    if (typeof key === 'string' && isSyncedKey(key)) schedule();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncNow().catch(() => {});
  };
  const onAnswered = () => void syncNow().catch(() => {});

  window.addEventListener(LOCAL_CHANGE_EVENT, onLocal);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener(IMPORT_ANSWERED_EVENT, onAnswered);
  void syncNow().catch(() => {});

  const stop = () => {
    if (timer !== null) {
      clearTimeout(timer);
      /* Записанное за последние секунды — в аккаунт, пока сессия жива. */
      void syncNow().catch(() => {});
    }
    window.removeEventListener(LOCAL_CHANGE_EVENT, onLocal);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener(IMPORT_ANSWERED_EVENT, onAnswered);
    if (stopCurrent === stop) stopCurrent = null;
  };
  stopCurrent = stop;
  return stop;
}
