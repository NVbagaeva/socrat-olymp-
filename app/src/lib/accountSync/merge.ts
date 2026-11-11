/**
 * Как сливаются данные двух устройств — чистые функции, без браузера.
 *
 * Синхронизация (./index.ts) берёт значение ключа на этом устройстве и в
 * аккаунте, сливает их здесь и пишет результат в обе стороны. Правило
 * своё для каждого вида данных:
 *
 *   журнал попыток    — объединение попыток по идентификатору (lib/progressLog);
 *   опорные задачи    — объединение номеров решённых задач по блокам;
 *   закладки          — по каждой закладке побеждает более поздняя запись;
 *   история           — объединение тренировок по идентификатору;
 *   тренировка        — побеждает более свежая (updatedAt); завершённая на
 *                       любом устройстве (есть в истории) не воскресает.
 *
 * Что синхронизируется — список ключей lib/progressImport/registry.ts.
 */

import { IMPORT_GROUPS } from '../progressImport/registry';
import { mergeLogs, parseLog } from '../progressLog/model';
import { mergeBookmarks, parseBookmarks } from '../zakladki/model';
import { mergeHistory, parseHistory } from '../istoriya/model';

/** Ключи, которые живут в аккаунте. */
export const SYNCED_KEYS: readonly string[] = IMPORT_GROUPS.flatMap((group) => group.keys);

export function isSyncedKey(key: string): boolean {
  return SYNCED_KEYS.includes(key);
}

const SESSION = /^budetege:trainer:[a-z0-9:_-]+:session$/;

/* ── Опорные задачи ──────────────────────────────────────────── */

function parsePrep(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  for (const [id, list] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(list)) {
      out[id] = list.filter(
        (n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0,
      );
    }
  }
  return out;
}

function mergePrep(a: unknown, b: unknown): Record<string, number[]> {
  const x = parsePrep(a);
  const y = parsePrep(b);
  const out: Record<string, number[]> = {};
  for (const id of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) {
    out[id] = [...new Set([...(x[id] ?? []), ...(y[id] ?? [])])].sort((p, q) => p - q);
  }
  return out;
}

/* ── Тренировка ──────────────────────────────────────────────── */

interface SessionHead {
  id: string;
  updatedAt: number;
}

function head(value: unknown): SessionHead | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.updatedAt === 'number'
    ? { id: v.id, updatedAt: v.updatedAt }
    : null;
}

/**
 * Тренировка: более свежая из двух; завершённая (её идентификатор есть
 * в истории) — никакая. null — записи быть не должно.
 */
export function mergeSession(
  local: unknown,
  server: unknown,
  finished: ReadonlySet<string>,
): unknown {
  const a = head(local);
  const b = head(server);
  const alive = (h: SessionHead | null) => h !== null && !finished.has(h.id);
  if (!alive(a) && !alive(b)) return null;
  if (!alive(a)) return server;
  if (!alive(b)) return local;
  return (a as SessionHead).updatedAt >= (b as SessionHead).updatedAt ? local : server;
}

/** То же на строках localStorage — для проверок и записи без разбора. */
export function mergeSessionRaw(
  local: string | null,
  server: string | null,
  finished: ReadonlySet<string>,
): string | null {
  const parse = (raw: string | null): unknown => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const merged = mergeSession(parse(local), parse(server), finished);
  if (merged === null) return null;
  return merged === parse(local)
    ? local
    : merged === parse(server)
      ? server
      : JSON.stringify(merged);
}

/* ── Общее ───────────────────────────────────────────────────── */

/**
 * Слить значения ключа. null на любой стороне — значения там нет.
 * finished — идентификаторы завершённых тренировок (из слитой истории).
 */
export function mergeValue(
  key: string,
  local: unknown,
  server: unknown,
  finished: ReadonlySet<string>,
): unknown {
  if (SESSION.test(key)) return mergeSession(local, server, finished);
  if (local === null || local === undefined) return server ?? null;
  if (server === null || server === undefined) return local;
  if (key.endsWith(':log:v1')) return mergeLogs(parseLog(local), parseLog(server));
  if (key.endsWith(':prep:v1')) return mergePrep(local, server);
  if (key === 'budetege:zakladki:v1')
    return mergeBookmarks(parseBookmarks(local), parseBookmarks(server));
  if (key === 'budetege:istoriya:v1')
    return mergeHistory(parseHistory(local), parseHistory(server));
  /* Неизвестный вид данных: аккаунт главнее. */
  return server;
}

/** Идентификаторы завершённых тренировок из значения истории. */
export function finishedSessions(historyValue: unknown): Set<string> {
  return new Set(parseHistory(historyValue).items.map((item) => item.id));
}
