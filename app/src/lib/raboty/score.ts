/** Баллы работы по оценкам — как submission_score_json в базе. */

import { PART2_NUMBERS } from '@/content/variantOnline/bally';
import { testScore } from '@/lib/variant/online/proverka';
import type { Grade, Score, SubStatus } from './types';

export function scoreOf(grades: readonly Grade[], status: SubStatus): Score {
  let part1 = 0;
  let part2 = 0;
  let graded2 = 0;
  for (const g of grades) {
    if (g.taskNo <= 13) part1 += g.ball;
    else {
      part2 += g.ball;
      if (!g.naDorabotke) graded2 += 1;
    }
  }
  const total = part1 + part2;
  return {
    part1,
    part2,
    total,
    max1: 13,
    max2: 20,
    max: 33,
    ungraded2: PART2_NUMBERS.length - graded2,
    test: status === 'checked' ? testScore(total) : null,
  };
}

/** Конец учебного года (31 августа) после даты — срок хранения фото. */
export function konetsUchebnogoGoda(at: Date): Date {
  const y = at.getUTCFullYear() + (at.getUTCMonth() >= 8 ? 1 : 0);
  /* 23:59:59 по Москве = 20:59:59 UTC. */
  return new Date(Date.UTC(y, 7, 31, 20, 59, 59));
}
