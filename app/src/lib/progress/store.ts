'use client';

/**
 * Единый журнал прогресса: хранилище в браузере.
 *
 * Тот же паттерн, что у остальных хранилищ прогресса в проекте:
 * useSyncExternalStore, снимок для сборки — пустой, try/catch вокруг
 * localStorage. Правило учёта (что идёт в окно навыка, что только
 * в журнал) — в core.ts, здесь только чтение и запись.
 *
 * Старые одиннадцать ключей прогресса этот модуль не трогает: он
 * пишется отдельным ключом рядом (временная двойная запись до конца
 * этапа 3).
 */

import { useSyncExternalStore } from 'react';
import { EMPTY, WINDOW, applyAttempt, type LegacyActivity, type ProgressData } from './core';
import type { Attempt, SkillTally, TaskNo, Verdict, WindowEntry } from './types';

export type { LegacyActivity, ProgressData } from './core';

export const PROGRESS_KEY = 'budetege:progress:v1';

const VERDICTS: readonly Verdict[] = ['correct', 'incorrect', 'skipped'];

function isVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && (VERDICTS as readonly string[]).includes(value);
}

function isTaskNo(value: unknown): value is TaskNo {
  return value === '3' || value === '4' || value === '5' || value === '8' || value === '12';
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Одна испорченная строка не должна ронять весь журнал. */
function parseAttempt(value: unknown): Attempt | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  if (
    !isTaskNo(v.taskNo) ||
    typeof v.subtopicId !== 'string' ||
    (v.source !== 'prep' && v.source !== 'trainer') ||
    typeof v.skillId !== 'string' ||
    typeof v.taskId !== 'string' ||
    !isVerdict(v.verdict) ||
    typeof v.hintUsed !== 'boolean' ||
    typeof v.firstTry !== 'boolean' ||
    typeof v.ts !== 'number'
  ) {
    return null;
  }
  return {
    taskNo: v.taskNo,
    subtopicId: v.subtopicId,
    source: v.source,
    skillId: v.skillId,
    taskId: v.taskId,
    instanceId: typeof v.instanceId === 'string' ? v.instanceId : v.taskId,
    seed: typeof v.seed === 'string' ? v.seed : null,
    verdict: v.verdict,
    hintUsed: v.hintUsed,
    firstTry: v.firstTry,
    seconds: num(v.seconds),
    ts: v.ts,
  };
}

function parseEntry(value: unknown): WindowEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  return typeof v.instance === 'string' && typeof v.credit === 'boolean'
    ? { instance: v.instance, credit: v.credit }
    : null;
}

function parseTally(value: unknown): SkillTally | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  const window = Array.isArray(v.window)
    ? v.window.map(parseEntry).filter((entry): entry is WindowEntry => entry !== null).slice(-WINDOW)
    : [];
  return {
    window,
    instancesTotal: num(v.instancesTotal),
    creditsTotal: num(v.creditsTotal),
    hintsTotal: num(v.hintsTotal),
    secondsTotal: num(v.secondsTotal),
    lastAttemptAt: typeof v.lastAttemptAt === 'number' ? v.lastAttemptAt : null,
  };
}

function parseLegacy(value: unknown): LegacyActivity | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  return typeof v.title === 'string' && typeof v.solved === 'number'
    ? { title: v.title, solved: v.solved }
    : null;
}

/** Разбор записи из хранилища. Мусор и чужой формат считаем пустотой. */
function parse(raw: string | null): ProgressData {
  if (raw === null) {
    return EMPTY;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return EMPTY;
    }
    const source = value as Record<string, unknown>;
    const journal = Array.isArray(source.journal)
      ? source.journal.map(parseAttempt).filter((item): item is Attempt => item !== null)
      : [];
    const skills: Record<string, SkillTally> = {};
    if (typeof source.skills === 'object' && source.skills !== null) {
      Object.entries(source.skills as Record<string, unknown>).forEach(([key, tally]) => {
        const parsed = parseTally(tally);
        if (parsed !== null) {
          skills[key] = parsed;
        }
      });
    }
    const legacy: Record<string, LegacyActivity> = {};
    if (typeof source.legacy === 'object' && source.legacy !== null) {
      Object.entries(source.legacy as Record<string, unknown>).forEach(([key, item]) => {
        const parsed = parseLegacy(item);
        if (parsed !== null) {
          legacy[key] = parsed;
        }
      });
    }
    return {
      schemaVersion: 1,
      journal,
      skills,
      legacy,
      migratedAt: typeof source.migratedAt === 'number' ? source.migratedAt : null,
    };
  } catch {
    return EMPTY;
  }
}

let cache: ProgressData | null = null;
const listeners = new Set<() => void>();

function read(): ProgressData {
  /* Приватный режим и запрет на хранилище: обращение само по себе
     может бросить исключение, поэтому в try завёрнуто и оно. */
  try {
    return parse(window.localStorage.getItem(PROGRESS_KEY));
  } catch {
    return EMPTY;
  }
}

function snapshot(): ProgressData {
  if (cache === null) {
    cache = read();
  }
  return cache;
}

function serverSnapshot(): ProgressData {
  return EMPTY;
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  /* Вторая вкладка того же браузера: там решали — здесь показываем. */
  const sync = (event: StorageEvent) => {
    if (event.key === PROGRESS_KEY || event.key === null) {
      cache = null;
      notify();
    }
  };
  window.addEventListener('storage', sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', sync);
  };
}

function save(next: ProgressData): void {
  cache = next;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    /* Хранилище недоступно или квота исчерпана — прогресс живёт
       до перезагрузки, экран при этом работает. */
  }
  notify();
}

/** Прогресс целиком. Перерисовка происходит сама при каждой записи. */
export function useProgressData(): ProgressData {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Снимок без подписки — для чтения вне компонентов (миграция, экспорт). */
export function getProgressData(): ProgressData {
  return snapshot();
}

export type RecordAttemptInput = Omit<Attempt, 'ts'> & { ts?: number };

export function recordAttempt(input: RecordAttemptInput): void {
  save(applyAttempt(snapshot(), { ...input, ts: input.ts ?? Date.now() }));
}

/** Историческая активность легаси-ключа: пишет только миграция. */
export function setLegacyActivity(legacyKey: string, activity: LegacyActivity): void {
  const current = snapshot();
  save({ ...current, legacy: { ...current.legacy, [legacyKey]: activity } });
}

export function markMigrated(): void {
  save({ ...snapshot(), migratedAt: Date.now() });
}

/** Сбросить новый журнал. Старые ключи не трогает: у каждого свой сброс. */
export function resetAll(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* Нечего чистить — значит и записать не удавалось. */
  }
  notify();
}

/** Журнал в каноническом формате попытки — то, что позже уйдёт на сервер. */
export function exportJournal(): Attempt[] {
  return snapshot().journal;
}
