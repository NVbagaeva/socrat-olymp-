'use client';

/**
 * Единый журнал прогресса: хранилище.
 *
 * Тот же паттерн, что у остальных хранилищ прогресса в проекте:
 * useSyncExternalStore, снимок для сборки — пустой, try/catch вокруг
 * localStorage. Отличие — два слоя: журнал попыток (ограничен по
 * числу записей) и агрегат по навыку, который считается добавлением
 * при каждой записи, а не пересчётом журнала. Поэтому обрезка
 * журнала агрегатам не вредит: освоенность не зависит от того,
 * сколько попыток физически осталось лежать.
 *
 * Старые одиннадцать ключей прогресса этот модуль не трогает и не
 * заменяет: он пишется отдельным, новым ключом рядом (см. отчёт
 * этапа 1 про временную двойную запись).
 */

import { useSyncExternalStore } from 'react';
import type { Attempt, SkillSource, SkillTally, TaskNo, Verdict } from './types';
import { isCredit } from './types';

export const PROGRESS_KEY = 'budetege:progress:v1';

/** Сколько последних попыток учитывается в освоенности навыка. */
export const WINDOW = 5;

/** Потолок журнала: строк с запасом на годы использования одним
    учеником, в бюджете примерно 1–1.5 МБ из пяти доступных на
    источник (localStorage может делить квоту с другими данными
    сайта). При переполнении вытесняются старейшие записи — агрегаты
    навыков от этого не страдают. */
const JOURNAL_CAP = 8000;

export function skillKey(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): string {
  return `${taskNo}:${subtopicId}:${source}:${skillId}`;
}

/** Историческая активность, перенесённая из старого ключа при
    миграции: только для строки «до обновления учёта решено N» на
    странице статистики — в освоенность навыков не идёт (см. п.1
    решений этапа 1: досчитывать зачёты по строгому новому правилу
    из старых счётчиков значило бы их выдумывать). */
export interface LegacyActivity {
  title: string;
  solved: number;
}

export interface ProgressData {
  schemaVersion: 1;
  journal: Attempt[];
  skills: Record<string, SkillTally>;
  legacy: Record<string, LegacyActivity>;
  /** Штамп однократной миграции легаси-ключей. null — ещё не была. */
  migratedAt: number | null;
}

const EMPTY: ProgressData = {
  schemaVersion: 1,
  journal: [],
  skills: {},
  legacy: {},
  migratedAt: null,
};

function emptyTally(): SkillTally {
  return { window: [], attemptsTotal: 0, creditsTotal: 0, hintsTotal: 0, secondsTotal: 0, lastAttemptAt: null };
}

const VERDICTS: readonly Verdict[] = ['correct', 'incorrect', 'skipped'];

function isVerdict(value: unknown): value is Verdict {
  return typeof value === 'string' && (VERDICTS as readonly string[]).includes(value);
}

function isTaskNo(value: unknown): value is TaskNo {
  return value === '3' || value === '4' || value === '5' || value === '8' || value === '12';
}

/** Разбор одной записи журнала. Мусор и чужой формат отбрасываются
    молча: одна испорченная строка не должна ронять весь журнал. */
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
    seed: typeof v.seed === 'string' ? v.seed : null,
    verdict: v.verdict,
    hintUsed: v.hintUsed,
    firstTry: v.firstTry,
    seconds: typeof v.seconds === 'number' && Number.isFinite(v.seconds) && v.seconds >= 0 ? v.seconds : 0,
    ts: v.ts,
  };
}

function parseTally(value: unknown): SkillTally | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  const window = Array.isArray(v.window)
    ? v.window.filter((item): item is boolean => typeof item === 'boolean').slice(-WINDOW)
    : [];
  return {
    window,
    attemptsTotal: typeof v.attemptsTotal === 'number' ? v.attemptsTotal : 0,
    creditsTotal: typeof v.creditsTotal === 'number' ? v.creditsTotal : 0,
    hintsTotal: typeof v.hintsTotal === 'number' ? v.hintsTotal : 0,
    secondsTotal: typeof v.secondsTotal === 'number' ? v.secondsTotal : 0,
    lastAttemptAt: typeof v.lastAttemptAt === 'number' ? v.lastAttemptAt : null,
  };
}

function parseLegacy(value: unknown): LegacyActivity | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const v = value as Record<string, unknown>;
  if (typeof v.title !== 'string' || typeof v.solved !== 'number') {
    return null;
  }
  return { title: v.title, solved: v.solved };
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

/** Записать попытку: одним ходом обновляет журнал и агрегат навыка. */
export function recordAttempt(input: RecordAttemptInput): void {
  const attempt: Attempt = { ...input, ts: input.ts ?? Date.now() };
  const current = snapshot();

  const key = skillKey(attempt.taskNo, attempt.subtopicId, attempt.source, attempt.skillId);
  const tally = current.skills[key] ?? emptyTally();
  const credit = isCredit(attempt);
  const nextTally: SkillTally = {
    window: [...tally.window, credit].slice(-WINDOW),
    attemptsTotal: tally.attemptsTotal + 1,
    creditsTotal: tally.creditsTotal + (credit ? 1 : 0),
    hintsTotal: tally.hintsTotal + (attempt.hintUsed ? 1 : 0),
    secondsTotal: tally.secondsTotal + Math.max(0, Math.round(attempt.seconds)),
    lastAttemptAt: attempt.ts,
  };

  const journal = [...current.journal, attempt];
  if (journal.length > JOURNAL_CAP) {
    journal.splice(0, journal.length - JOURNAL_CAP);
  }

  save({ ...current, journal, skills: { ...current.skills, [key]: nextTally } });
}

/** Историческая активность легаси-ключа: пишет только миграция. */
export function setLegacyActivity(legacyKey: string, activity: LegacyActivity): void {
  const current = snapshot();
  save({ ...current, legacy: { ...current.legacy, [legacyKey]: activity } });
}

export function markMigrated(): void {
  const current = snapshot();
  save({ ...current, migratedAt: Date.now() });
}

/** Сбросить весь новый журнал. Старые одиннадцать ключей не трогает:
    у каждого свой сброс, и этот модуль их не заменяет (см. отчёт). */
export function resetAll(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* Нечего чистить — значит и записать не удавалось. */
  }
  notify();
}

/** Журнал целиком, в каноническом формате попытки — то, что можно
    будет позже отправить на сервер без переделки формата. */
export function exportJournal(): Attempt[] {
  return snapshot().journal;
}
