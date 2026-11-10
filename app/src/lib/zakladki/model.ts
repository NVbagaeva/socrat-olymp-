/**
 * Закладки «Отложить на потом» — чистые функции, без браузера.
 *
 * Ученик откладывает задачу тренажёра или опорную задачу, чтобы
 * вернуться к ней позже; список виден в кабинете. Закладка не хранит
 * условия: только адрес, по которому задача собирается заново, и
 * подпись для списка. Ответов здесь нет.
 *
 * Снятая закладка не удаляется, а помечается (removedAt): иначе при
 * слиянии двух устройств она вернулась бы с того, где её ещё не сняли.
 * Из двух записей одной закладки побеждает более поздняя (updatedAt).
 */

export type BookmarkPlace = 'trenazher' | 'opornye';

export interface Bookmark {
  /** «8:trenazher:8.A|seed|base», «8:opornye:stepeni#3». */
  id: string;
  /** Раздел: «8». */
  section: string;
  place: BookmarkPlace;
  /** Что открыть: идентификатор задачи тренажёра или «блок#номер». */
  ref: string;
  /** Подпись в списке: «№8 · Степени с одним основанием». */
  title: string;
  /** Адрес, по которому задача открывается. */
  href: string;
  addedAt: number;
  updatedAt: number;
  removedAt?: number;
}

export interface Bookmarks {
  v: 1;
  items: Bookmark[];
}

export const EMPTY_BOOKMARKS: Bookmarks = { v: 1, items: [] };

/** Сколько записей держать вместе со снятыми. */
const LIMIT = 300;

function str(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function bookmarkId(section: string, place: BookmarkPlace, ref: string): string {
  return `${section}:${place}:${ref}`;
}

export function parseBookmarks(raw: unknown): Bookmarks {
  if (typeof raw !== 'object' || raw === null) return EMPTY_BOOKMARKS;
  const list = (raw as Record<string, unknown>).items;
  if (!Array.isArray(list)) return EMPTY_BOOKMARKS;
  const items: Bookmark[] = [];
  for (const value of list) {
    if (typeof value !== 'object' || value === null) continue;
    const v = value as Record<string, unknown>;
    const id = str(v.id, 200);
    const section = str(v.section, 8);
    const place = v.place === 'trenazher' || v.place === 'opornye' ? v.place : null;
    const ref = str(v.ref, 160);
    const title = str(v.title, 200);
    const href = str(v.href, 400);
    if (id === null || section === null || place === null || ref === null || title === null || href === null) {
      continue;
    }
    /* Адрес — только внутренний: закладка не уводит с сайта. */
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const item: Bookmark = { id, section, place, ref, title, href, addedAt: num(v.addedAt), updatedAt: num(v.updatedAt) };
    if (typeof v.removedAt === 'number' && v.removedAt > 0) item.removedAt = v.removedAt;
    items.push(item);
  }
  return { v: 1, items };
}

function keep(items: Bookmark[]): Bookmark[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, LIMIT);
}

/** Слить закладки двух устройств: по каждой — более поздняя запись. */
export function mergeBookmarks(a: Bookmarks, b: Bookmarks): Bookmarks {
  const byId = new Map<string, Bookmark>();
  for (const item of [...b.items, ...a.items]) {
    const had = byId.get(item.id);
    if (had === undefined || item.updatedAt >= had.updatedAt) byId.set(item.id, item);
  }
  return { v: 1, items: keep([...byId.values()]) };
}

/** Отложенные задачи: без снятых, новые сверху. */
export function activeBookmarks(list: Bookmarks, section?: string): Bookmark[] {
  return list.items
    .filter((item) => item.removedAt === undefined && (section === undefined || item.section === section))
    .sort((a, b) => b.addedAt - a.addedAt);
}

export function isBookmarked(list: Bookmarks, id: string): boolean {
  return list.items.some((item) => item.id === id && item.removedAt === undefined);
}

/** Отложить или снять закладку. now — для проверок. */
export function toggleBookmark(
  list: Bookmarks,
  item: Omit<Bookmark, 'addedAt' | 'updatedAt' | 'removedAt'>,
  now: number = Date.now(),
): Bookmarks {
  const had = list.items.find((entry) => entry.id === item.id);
  const others = list.items.filter((entry) => entry.id !== item.id);
  if (had !== undefined && had.removedAt === undefined) {
    return { v: 1, items: keep([...others, { ...had, updatedAt: now, removedAt: now }]) };
  }
  return { v: 1, items: keep([...others, { ...item, addedAt: now, updatedAt: now }]) };
}
