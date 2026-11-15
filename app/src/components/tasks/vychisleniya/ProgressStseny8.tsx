'use client';

import { StrokaProgressa } from '@/components/tasks/stsena';
import { distinctSolved } from '@/lib/progressLog';
import { isBankTask } from '@/lib/vychisleniya/ids';
import { log8 } from '@/lib/vychisleniya/progress';

/**
 * «Решено 12 из 260» в шапке №8: разные задачи банка, решённые в
 * тренажёре, из общего журнала попыток. Тот же счёт, что под
 * конфигуратором тренажёра (BankCounter8), только видом короче.
 */
export function ProgressStseny8({ iz }: { iz: number }) {
  const log = log8.use();
  const n = Math.min(iz, distinctSolved(log, isBankTask));
  return <StrokaProgressa n={n} iz={iz} />;
}
