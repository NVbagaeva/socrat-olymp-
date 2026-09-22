'use client';

/**
 * Состояние навыка по журналу прогресса.
 *
 * Подтема/задание/сайт сюда намеренно не входят: их агрегация нужна
 * только вместе с реестром навыков (что подтема открыта, сколько
 * в ней навыков), а реестр имеет смысл строить вместе с экраном,
 * который его покажет, — на этапе 2–3. Считать эти уровни сейчас,
 * когда их ничто не показывает и не проверяет, — больше риска
 * незамеченной ошибки в разметке навыков, чем пользы.
 */

import { WINDOW, getProgressData, skillKey, useProgressData } from './store';
import type { SkillSource, SkillState, SkillStatus, SkillTally, TaskNo } from './types';

const REVIEW_DAYS = 30;
const REVIEW_MS = REVIEW_DAYS * 24 * 60 * 60 * 1000;

function emptyTally(): SkillTally {
  return { window: [], attemptsTotal: 0, creditsTotal: 0, hintsTotal: 0, secondsTotal: 0, lastAttemptAt: null };
}

/** 0 попыток — «не начат»; полное окно из 5 с 4+ зачётами — «освоен»;
    иначе, если попытка хоть одна была, — «в работе». Статус обратим:
    он всегда считается заново по последним пяти, а не хранится как
    отдельный флаг — упавшее ниже 4 из 5 окно само вернёт «в работе». */
function statusOf(tally: SkillTally): SkillStatus {
  if (tally.window.length === 0) {
    return 'none';
  }
  const credits = tally.window.filter(Boolean).length;
  if (tally.window.length >= WINDOW && credits >= 4) {
    return 'mastered';
  }
  return 'in-progress';
}

function toState(tally: SkillTally): SkillState {
  const status = statusOf(tally);
  const dueForReview =
    status === 'mastered' && tally.lastAttemptAt !== null && Date.now() - tally.lastAttemptAt > REVIEW_MS;
  return { ...tally, status, dueForReview };
}

/** Состояние навыка вне компонентов (например, для отчётов). */
export function getSkillState(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): SkillState {
  const key = skillKey(taskNo, subtopicId, source, skillId);
  return toState(getProgressData().skills[key] ?? emptyTally());
}

/** То же самое с подпиской на изменения — для компонентов. */
export function useSkillState(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): SkillState {
  const data = useProgressData();
  const key = skillKey(taskNo, subtopicId, source, skillId);
  return toState(data.skills[key] ?? emptyTally());
}
