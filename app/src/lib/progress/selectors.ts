'use client';

/**
 * Состояние навыка по журналу прогресса.
 *
 * Подтема, задание и сайт сюда пока не входят: их агрегация нужна
 * вместе с реестром навыков, а реестр строится вместе с экраном,
 * который его покажет (этап 2–3).
 */

import { emptyTally, skillKey, statusOf } from './core';
import { getProgressData, useProgressData } from './store';
import type { SkillSource, SkillState, SkillTally, TaskNo } from './types';

const REVIEW_MS = 30 * 24 * 60 * 60 * 1000;

function toState(tally: SkillTally): SkillState {
  const status = statusOf(tally);
  const dueForReview =
    status === 'mastered' && tally.lastAttemptAt !== null && Date.now() - tally.lastAttemptAt > REVIEW_MS;
  return { ...tally, status, dueForReview };
}

export function getSkillState(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): SkillState {
  return toState(getProgressData().skills[skillKey(taskNo, subtopicId, source, skillId)] ?? emptyTally());
}

export function useSkillState(taskNo: TaskNo, subtopicId: string, source: SkillSource, skillId: string): SkillState {
  const data = useProgressData();
  return toState(data.skills[skillKey(taskNo, subtopicId, source, skillId)] ?? emptyTally());
}
