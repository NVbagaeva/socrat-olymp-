/**
 * Ядро журнала прогресса: чистые функции без React и без браузера.
 *
 * Здесь решается главное правило учёта: окно навыка получает одну
 * запись на экземпляр задачи — итог этого экземпляра. Итог определяет
 * первая его попытка, не считая пропуска: верно с первой проверки без
 * подсказки — зачёт, всё остальное — незачёт. Повторные проверки того
 * же экземпляра ложатся в журнал, но окно не трогают. Пропуск ложится
 * только в журнал.
 *
 * Модуль отдельный, чтобы правило проверялось автотестом
 * (scripts/check-progress.mjs) без браузера.
 */

import { isCredit, type Attempt, type SkillSource, type SkillStatus, type SkillTally, type TaskNo } from './types';

/** Сколько последних экземпляров задачи учитывается в освоенности. */
export const WINDOW = 5;

/** Сколько зачётов в полном окне дают «освоен». */
export const MASTERY = 4;

/** Потолок журнала: с запасом на годы использования одним учеником,
    около 1–1.5 МБ из примерно пяти доступных на источник. При
    переполнении уходят старейшие записи — окна навыков не страдают,
    они хранятся отдельно от журнала. */
export const JOURNAL_CAP = 8000;

/** Историческая активность, перенесённая из старого ключа: только для
    строки «до обновления учёта решено N» — в освоенность не идёт. */
export interface LegacyActivity {
  title: string;
  solved: number;
}

export interface ProgressData {
  schemaVersion: 1;
  journal: Attempt[];
  skills: Record<string, SkillTally>;
  legacy: Record<string, LegacyActivity>;
  /** Штамп однократной миграции легаси-ключей. null — ещё не было. */
  migratedAt: number | null;
}

export const EMPTY: ProgressData = {
  schemaVersion: 1,
  journal: [],
  skills: {},
  legacy: {},
  migratedAt: null,
};

export function skillKey(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): string {
  return `${taskNo}:${subtopicId}:${source}:${skillId}`;
}

export function emptyTally(): SkillTally {
  return { window: [], instancesTotal: 0, creditsTotal: 0, hintsTotal: 0, secondsTotal: 0, lastAttemptAt: null };
}

/** Добавить попытку: журнал — всегда, окно — только итогом нового экземпляра. */
export function applyAttempt(data: ProgressData, attempt: Attempt): ProgressData {
  const journal = [...data.journal, attempt];
  if (journal.length > JOURNAL_CAP) {
    journal.splice(0, journal.length - JOURNAL_CAP);
  }

  if (attempt.verdict === 'skipped') {
    return { ...data, journal };
  }

  const key = skillKey(attempt.taskNo, attempt.subtopicId, attempt.source, attempt.skillId);
  const tally = data.skills[key] ?? emptyTally();
  /* Экземпляр уже получил итог — это повторная проверка той же задачи. */
  if (tally.window.some((entry) => entry.instance === attempt.instanceId)) {
    return { ...data, journal };
  }

  const credit = isCredit(attempt);
  const next: SkillTally = {
    window: [...tally.window, { instance: attempt.instanceId, credit }].slice(-WINDOW),
    instancesTotal: tally.instancesTotal + 1,
    creditsTotal: tally.creditsTotal + (credit ? 1 : 0),
    hintsTotal: tally.hintsTotal + (attempt.hintUsed ? 1 : 0),
    secondsTotal: tally.secondsTotal + Math.max(0, Math.round(attempt.seconds)),
    lastAttemptAt: attempt.ts,
  };
  return { ...data, journal, skills: { ...data.skills, [key]: next } };
}

/** Статус считается заново по окну и потому обратим: окно, упавшее
    ниже 4 зачётов из 5, само возвращает «в работе». */
export function statusOf(tally: SkillTally): SkillStatus {
  if (tally.window.length === 0) {
    return 'none';
  }
  const credits = tally.window.filter((entry) => entry.credit).length;
  return tally.window.length >= WINDOW && credits >= MASTERY ? 'mastered' : 'in-progress';
}
