'use client';

/**
 * Хранилище сессий тренажёров.
 *
 * Одна запись на тренажёр: `budetege:trainer:<раздел>:session`, где
 * раздел — «8», «11», «12:linear», «3:konus». Запись лежит в
 * localStorage целиком (задания, ответы, пауза, время), поэтому
 * сессия переживает и переход в другой раздел, и перезагрузку.
 *
 * Всё в try/catch: в приватном окне доступ к хранилищу выбрасывает
 * исключение, а квота может кончиться посреди тренировки. Тренажёр
 * при этом работает как раньше, только без сохранения.
 */

import { useSyncExternalStore } from 'react';
import { browserStorage } from '@/lib/storage';
import {
  TRAINER_SCHEMA_VERSION,
  type ReadResult,
  type SessionHead,
  type StoredSession,
  type WriteResult,
} from './types';

const PREFIX = 'budetege:trainer:';
const SUFFIX = ':session';

/** Ключ записи в localStorage. */
export function sessionKey(scope: string): string {
  return `${PREFIX}${scope}${SUFFIX}`;
}

/** Идентификатор этой вкладки: по нему вкладки отличают свои записи от чужих. */
export const TAB_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Новый идентификатор тренировки. */
export function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Работает ли localStorage: проверяется пробной записью. */
export function storageAvailable(): boolean {
  const target = browserStorage();
  if (target === null) {
    return false;
  }
  try {
    const probe = `${PREFIX}probe`;
    target.setItem(probe, '1');
    target.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/* ── Запись ─────────────────────────────────────────────────────── */

/**
 * Собрать запись строкой. Служебные поля идут первыми и в одном порядке:
 * соседние вкладки читают их регулярным выражением (peekHead), не разбирая
 * сотни килобайт заданий на каждое нажатие клавиши. Задания не меняются
 * за всю тренировку, поэтому приходят уже готовой строкой.
 */
export function encodeSession(head: SessionHead, uiJson: string, payloadJson: string): string {
  return (
    `{"schemaVersion":${TRAINER_SCHEMA_VERSION}` +
    `,"scope":${JSON.stringify(head.scope)}` +
    `,"id":${JSON.stringify(head.id)}` +
    `,"createdAt":${head.createdAt}` +
    `,"updatedAt":${head.updatedAt}` +
    `,"rev":${head.rev}` +
    `,"writer":${JSON.stringify(head.writer)}` +
    `,"paused":${head.paused ? 'true' : 'false'}` +
    `,"activeMs":${Math.max(0, Math.round(head.activeMs))}` +
    `,"total":${Math.max(0, Math.round(head.total))}` +
    `,"ui":${uiJson}` +
    `,"payload":${payloadJson}}`
  );
}

/** Кончилось ли место: имена исключения в браузерах разные. */
function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  );
}

/**
 * Записать готовую строку.
 *
 * Не хватило места — по одной убираются незавершённые тренировки других
 * разделов, начиная с самой давней, и запись повторяется. Своя запись
 * и чужие данные сайта (прогресс, отметки теории) не трогаются. Не
 * помогло — 'quota': тренировка идёт дальше без сохранения.
 */
export function writeRaw(scope: string, raw: string): WriteResult {
  const target = browserStorage();
  if (target === null) {
    return 'denied';
  }
  const key = sessionKey(scope);
  for (;;) {
    try {
      target.setItem(key, raw);
      return 'ok';
    } catch (error) {
      if (!isQuotaError(error)) {
        return 'denied';
      }
      if (!evictOldest(target, scope)) {
        return 'quota';
      }
    }
  }
}

/** Убрать самую давнюю тренировку другого раздела. false — убирать нечего. */
function evictOldest(target: Storage, keep: string): boolean {
  let oldest: { key: string; at: number } | null = null;
  try {
    for (let i = 0; i < target.length; i += 1) {
      const key = target.key(i);
      const scope = key === null ? null : scopeOfKey(key);
      if (key === null || scope === null || scope === keep) {
        continue;
      }
      const head = peekHead(target.getItem(key) ?? '');
      /* Запись не читается — она и есть самая ненужная. */
      const at = head === null ? -1 : head.updatedAt;
      if (oldest === null || at < oldest.at) {
        oldest = { key, at };
      }
    }
    if (oldest === null) {
      return false;
    }
    target.removeItem(oldest.key);
  } catch {
    return false;
  }
  notifySessionsChanged();
  return true;
}

/** Удалить запись и сообщить меню: метка на вкладке гаснет. */
export function clearSession(scope: string): void {
  try {
    browserStorage()?.removeItem(sessionKey(scope));
  } catch {
    /* Запретили запись — удалять нечего. */
  }
  notifySessionsChanged();
}

/* ── Чтение ─────────────────────────────────────────────────────── */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Разобрать запись. null — формат не тот или поля испорчены. */
export function decodeSession(raw: string, scope: string): StoredSession | 'version' | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data)) {
    return null;
  }
  if (data['schemaVersion'] !== TRAINER_SCHEMA_VERSION) {
    return 'version';
  }
  const { id, writer, paused, createdAt, updatedAt, rev, activeMs, total } = data;
  if (
    data['scope'] !== scope ||
    typeof id !== 'string' ||
    id === '' ||
    typeof writer !== 'string' ||
    typeof paused !== 'boolean' ||
    !isFiniteNumber(createdAt) ||
    !isFiniteNumber(updatedAt) ||
    !isFiniteNumber(rev) ||
    !isFiniteNumber(activeMs) ||
    !isFiniteNumber(total) ||
    !('payload' in data)
  ) {
    return null;
  }
  return {
    schemaVersion: TRAINER_SCHEMA_VERSION,
    scope,
    id,
    createdAt,
    updatedAt,
    rev,
    writer,
    paused,
    activeMs: Math.max(0, activeMs),
    total: Math.max(0, total),
    ui: data['ui'] ?? null,
    payload: data['payload'],
  };
}

/**
 * Прочитать сессию тренажёра. Запись, которая не читается, убирается
 * из хранилища: иначе она висела бы меткой в меню, а войти в неё было
 * бы нельзя.
 */
export function readSession(scope: string): ReadResult {
  const target = browserStorage();
  if (target === null) {
    return { status: 'none' };
  }
  let raw: string | null;
  try {
    raw = target.getItem(sessionKey(scope));
  } catch {
    return { status: 'none' };
  }
  if (raw === null) {
    return { status: 'none' };
  }
  const decoded = decodeSession(raw, scope);
  if (decoded !== null && decoded !== 'version') {
    return { status: 'ok', session: decoded };
  }
  clearSession(scope);
  return { status: 'reset', reason: decoded === 'version' ? 'version' : 'broken' };
}

/** Служебные поля записи, прочитанные без разбора заданий. */
export interface PeekedHead {
  schemaVersion: number;
  id: string;
  updatedAt: number;
  rev: number;
  writer: string;
}

const HEAD =
  /^\{"schemaVersion":(\d+),"scope":"[^"]*","id":"([^"]*)","createdAt":\d+,"updatedAt":(\d+),"rev":(\d+),"writer":"([^"]*)"/;

/** Быстрый взгляд на запись: чья она и какая по счёту. null — не наша запись. */
export function peekHead(raw: string): PeekedHead | null {
  const found = HEAD.exec(raw);
  if (found === null) {
    return null;
  }
  return {
    schemaVersion: Number(found[1]),
    id: found[2] ?? '',
    updatedAt: Number(found[3]),
    rev: Number(found[4]),
    writer: found[5] ?? '',
  };
}

/* ── Реестр: у каких тренажёров есть незавершённая тренировка ───── */

const EMPTY: readonly string[] = [];
const listeners = new Set<() => void>();
let cache: readonly string[] | null = null;
let attached = false;

/** Раздел из ключа записи; null — ключ чужой. */
function scopeOfKey(key: string): string | null {
  return key.startsWith(PREFIX) &&
    key.endsWith(SUFFIX) &&
    key.length > PREFIX.length + SUFFIX.length
    ? key.slice(PREFIX.length, key.length - SUFFIX.length)
    : null;
}

function scanScopes(): readonly string[] {
  const target = browserStorage();
  if (target === null) {
    return EMPTY;
  }
  const found: string[] = [];
  try {
    for (let i = 0; i < target.length; i += 1) {
      const key = target.key(i);
      const scope = key === null ? null : scopeOfKey(key);
      if (key === null || scope === null) {
        continue;
      }
      /* Устаревшая запись меткой не считается: войти в неё нельзя. */
      const head = peekHead(target.getItem(key) ?? '');
      if (head !== null && head.schemaVersion === TRAINER_SCHEMA_VERSION) {
        found.push(scope);
      }
    }
  } catch {
    return EMPTY;
  }
  found.sort();
  return found;
}

function snapshot(): readonly string[] {
  if (cache === null) {
    const next = scanScopes();
    cache = next.length === 0 ? EMPTY : next;
  }
  return cache;
}

/** Реестр устарел: начата или закончена тренировка. */
export function notifySessionsChanged(): void {
  const before = cache;
  cache = null;
  const after = snapshot();
  const same =
    before !== null &&
    before.length === after.length &&
    before.every((item, i) => item === after[i]);
  if (same) {
    cache = before;
    return;
  }
  listeners.forEach((listener) => listener());
}

function attach(): void {
  if (attached || typeof window === 'undefined') {
    return;
  }
  attached = true;
  /* Запись из другой вкладки: событие приходит только в соседние вкладки. */
  window.addEventListener('storage', (event) => {
    if (event.key === null || scopeOfKey(event.key) !== null) {
      notifySessionsChanged();
    }
  });
}

function subscribe(listener: () => void): () => void {
  attach();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Разделы с незавершённой тренировкой. На сервере — пусто. */
export function useActiveTrainerScopes(): readonly string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/* ── Старые записи ──────────────────────────────────────────────── */

/**
 * Ключи, под которыми тренажёры хранили свои сессии до общего модуля.
 * Тренажёр, переведённый на общую оболочку, дописывает сюда свои
 * прежние ключи: у учеников они больше не читаются и только занимают
 * место. Ключи прогресса (счётчики, ошибки) сюда не попадают — они живы.
 */
export const LEGACY_SESSION_KEYS: readonly string[] = [
  /* №1: тренировка на паузе (план, номер задачи, отметки). */
  'budetege:planimetriya-1:trenazher-pauza:v1',
];

let swept = false;

/**
 * Убрать то, что больше не прочтётся: записи сессий другой версии схемы
 * (в том числе версии 1, где задания лежали целиком) и прежние ключи
 * тренажёров. Один раз за жизнь страницы.
 */
export function sweepStaleSessions(): void {
  if (swept) {
    return;
  }
  swept = true;
  const target = browserStorage();
  if (target === null) {
    return;
  }
  const doomed: string[] = [];
  try {
    for (let i = 0; i < target.length; i += 1) {
      const key = target.key(i);
      if (key === null) {
        continue;
      }
      if (LEGACY_SESSION_KEYS.includes(key)) {
        doomed.push(key);
        continue;
      }
      if (scopeOfKey(key) === null) {
        continue;
      }
      const head = peekHead(target.getItem(key) ?? '');
      if (head === null || head.schemaVersion !== TRAINER_SCHEMA_VERSION) {
        doomed.push(key);
      }
    }
    doomed.forEach((key) => target.removeItem(key));
  } catch {
    return;
  }
  if (doomed.length > 0) {
    notifySessionsChanged();
  }
}

/** Только для проверок: разрешить повторную уборку. */
export function resetSweepForTests(): void {
  swept = false;
}
