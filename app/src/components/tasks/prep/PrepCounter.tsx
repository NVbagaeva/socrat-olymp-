'use client';

import { OPORNYE } from '@/content/opornye';
import { ProgressBar } from '@/components/ui';
import { solvedCount, usePrepProgress } from '@/lib/prepProgress';

export interface PrepTotal {
  id: string;
  total: number;
}

export interface PrepCounterProps {
  /** Сколько задач в каждом навыке: числа приходят из данных движка. */
  totals: PrepTotal[];
}

/**
 * Строка «N из 40 заданий» и полоса под ней.
 *
 * Число решённых читается из хранилища браузера и обновляется сразу
 * после верного ответа — экран задачи и эта строка смотрят в одно
 * и то же место.
 */
export function PrepCounter({ totals }: PrepCounterProps) {
  const progress = usePrepProgress();

  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce((sum, item) => sum + solvedCount(progress, item.id, item.total), 0);
  const percent = total === 0 ? 0 : (solved / total) * 100;

  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} заданий
      </p>
      <ProgressBar
        className="prep__meter"
        value={percent}
        label={`${OPORNYE.title}: решено ${solved} из ${total}`}
      />
    </>
  );
}
