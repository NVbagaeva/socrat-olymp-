/**
 * История тренировок — чистые функции, без браузера.
 *
 * Каждая завершённая тренировка любого тренажёра — одна запись: когда,
 * сколько заданий, сколько верно, сколько времени, какие типы
 * просели. Запись пишет общая оболочка тренировки
 * (components/tasks/session), поэтому история одна на все разделы.
 *
 * Идентификатор записи — идентификатор тренировки. По нему же
 * синхронизация понимает, что тренировка завершена и продолжать её на
 * другом устройстве не нужно.
 */

export interface HistoryEntry {
  /** Идентификатор тренировки. */
  id: string;
  /** Раздел тренажёра: «8», «12:linear». */
  scope: string;
  /** Когда завершена, мс. */
  at: number;
  total: number;
  right: number;
  /** Решено с открытым решением или подсказкой. */
  hinted: number;
  wrong: number;
  skipped: number;
  seconds: number;
  /** Типы, в которых были ошибки, — «какие просели». */
  weak: string[];
}

export interface History {
  v: 1;
  items: HistoryEntry[];
}

export const EMPTY_HISTORY: History = { v: 1, items: [] };

/** Сколько тренировок помнить. */
export const HISTORY_LIMIT = 200;

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

export function parseHistory(raw: unknown): History {
  if (typeof raw !== 'object' || raw === null) return EMPTY_HISTORY;
  const list = (raw as Record<string, unknown>).items;
  if (!Array.isArray(list)) return EMPTY_HISTORY;
  const items: HistoryEntry[] = [];
  for (const value of list) {
    if (typeof value !== 'object' || value === null) continue;
    const v = value as Record<string, unknown>;
    if (typeof v.id !== 'string' || v.id.length === 0 || v.id.length > 64) continue;
    if (typeof v.scope !== 'string' || v.scope.length === 0 || v.scope.length > 40) continue;
    items.push({
      id: v.id,
      scope: v.scope,
      at: num(v.at),
      total: num(v.total),
      right: num(v.right),
      hinted: num(v.hinted),
      wrong: num(v.wrong),
      skipped: num(v.skipped),
      seconds: num(v.seconds),
      weak: Array.isArray(v.weak)
        ? v.weak.filter((item): item is string => typeof item === 'string' && item.length <= 120).slice(0, 20)
        : [],
    });
  }
  return { v: 1, items: sortHistory(items) };
}

function sortHistory(items: HistoryEntry[]): HistoryEntry[] {
  return [...items].sort((a, b) => b.at - a.at).slice(0, HISTORY_LIMIT);
}

export function addHistory(list: History, entry: HistoryEntry): History {
  return { v: 1, items: sortHistory([entry, ...list.items.filter((item) => item.id !== entry.id)]) };
}

export function mergeHistory(a: History, b: History): History {
  const byId = new Map<string, HistoryEntry>();
  for (const item of [...b.items, ...a.items]) byId.set(item.id, item);
  return { v: 1, items: sortHistory([...byId.values()]) };
}

/** Тренировки раздела: «8» — и «8», и «8:что-то». */
export function historyOf(list: History, section: string): HistoryEntry[] {
  return list.items.filter((item) => item.scope === section || item.scope.startsWith(`${section}:`));
}
