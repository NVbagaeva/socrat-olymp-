'use client';

/**
 * Перенос прогресса гостя в аккаунт.
 *
 * Гость пользуется сайтом без входа: прогресс лежит в localStorage. При
 * первом входе в кабинет сайт спрашивает: «Перенести ваш прогресс с
 * этого устройства в кабинет?» «Да» — значения ключей из registry.ts
 * уходят в таблицу user_storage как есть; «Нет» — ничего не уходит.
 * Ответ запоминается для этого аккаунта в этом браузере, второй раз
 * вопроса нет. Сам localStorage не меняется: сайт продолжает работать
 * с ним, как раньше.
 *
 * Чтение хранилища здесь без SDK; SDK подтягивается только на «Да».
 */

import { browserStorage } from '@/lib/storage';
import {
  IMPORT_GROUPS,
  IMPORT_KEY_PATTERN,
  IMPORT_VALUE_LIMIT,
  type ImportGroup,
} from './registry';

export { IMPORT_GROUPS } from './registry';
export type { ImportGroup } from './registry';

export interface LocalEntry {
  key: string;
  value: unknown;
}

export interface LocalGroup {
  group: ImportGroup;
  entries: LocalEntry[];
}

/** Что из списка registry.ts есть в этом браузере. Пустые разделы не возвращаются. */
export function localProgress(): LocalGroup[] {
  const target = browserStorage();
  if (target === null) return [];
  const found: LocalGroup[] = [];
  for (const group of IMPORT_GROUPS) {
    const entries: LocalEntry[] = [];
    for (const key of group.keys) {
      if (!IMPORT_KEY_PATTERN.test(key)) continue;
      try {
        const raw = target.getItem(key);
        if (raw === null || raw.length > IMPORT_VALUE_LIMIT) continue;
        const value: unknown = JSON.parse(raw);
        if (value === null || typeof value !== 'object') continue;
        entries.push({ key, value });
      } catch {
        /* Испорченное значение переносить незачем. */
      }
    }
    if (entries.length > 0) found.push({ group, entries });
  }
  return found;
}

/* ── Ответ на вопрос ──────────────────────────────────────────── */

export type ImportAnswer = 'yes' | 'no';

interface AnswerRecord {
  answer: ImportAnswer;
  at: string;
}

/** Ответы по аккаунтам: один браузер может знать несколько аккаунтов. */
const ANSWERS_KEY = 'budetege:import:answers';

function readAnswers(): Record<string, AnswerRecord> {
  try {
    const raw = browserStorage()?.getItem(ANSWERS_KEY) ?? null;
    const data: unknown = raw === null ? {} : JSON.parse(raw);
    return data !== null && typeof data === 'object' ? (data as Record<string, AnswerRecord>) : {};
  } catch {
    return {};
  }
}

export function importAnswer(userId: string): AnswerRecord | null {
  return readAnswers()[userId] ?? null;
}

export function rememberImportAnswer(userId: string, answer: ImportAnswer): void {
  try {
    const all = readAnswers();
    all[userId] = { answer, at: new Date().toISOString() };
    browserStorage()?.setItem(ANSWERS_KEY, JSON.stringify(all));
  } catch {
    /* Нет хранилища — спросим ещё раз в следующий вход. */
  }
}

/** Спрашивать ли: в браузере есть что переносить и этот аккаунт ещё не отвечал. */
export function shouldAskImport(userId: string): boolean {
  return importAnswer(userId) === null && localProgress().length > 0;
}

/* ── Запись в аккаунт ─────────────────────────────────────────── */

export interface ImportedKey {
  key: string;
  updatedAt: string;
}

/** Перенести найденное в аккаунт. Возвращает число записанных ключей. */
export async function uploadLocalProgress(groups: readonly LocalGroup[]): Promise<number> {
  const rows = groups.flatMap((item) =>
    item.entries.map((entry) => ({ key: entry.key, value: entry.value })),
  );
  if (rows.length === 0) return 0;
  const { getClient } = await import('@/lib/auth/client');
  const supabase = await getClient();
  const { error } = await supabase.from('user_storage').upsert(rows, { onConflict: 'user_id,key' });
  if (error) throw new Error(error.message);
  return rows.length;
}

/** Что уже лежит в аккаунте. Ошибка чтения — пустой список. */
export async function loadImportedKeys(): Promise<ImportedKey[]> {
  try {
    const { getClient } = await import('@/lib/auth/client');
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('user_storage')
      .select('key, updated_at')
      .order('updated_at', { ascending: false })
      .returns<{ key: string; updated_at: string }[]>();
    if (error || data === null) return [];
    return data.map((row) => ({ key: row.key, updatedAt: row.updated_at }));
  } catch {
    return [];
  }
}

/** Разделы, чьи ключи есть в аккаунте, с датой последнего переноса. */
export function importedGroups(keys: readonly ImportedKey[]): { title: string; at: string }[] {
  const out: { title: string; at: string }[] = [];
  for (const group of IMPORT_GROUPS) {
    const mine = keys.filter((item) => group.keys.includes(item.key));
    if (mine.length === 0) continue;
    const at =
      mine
        .map((item) => item.updatedAt)
        .sort()
        .at(-1) ?? '';
    out.push({ title: group.title, at });
  }
  return out;
}
