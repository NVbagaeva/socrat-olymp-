'use client';

import { ProgressBar } from '@/components/ui';
import { solvedCount, usePrepProgress } from '@/lib/prepProgress';

export interface PrepCardMeterProps {
  id: string;
  /** Сколько задач в наборе навыка. */
  total: number;
  /** Название навыка: уходит в подпись полосы для скринридера. */
  title: string;
}

/** Полоса и строка «N из 10» на карточке навыка. */
export function PrepCardMeter({ id, total, title }: PrepCardMeterProps) {
  const progress = usePrepProgress();
  const solved = solvedCount(progress, id, total);

  return (
    <span className="prep-card__meter">
      <ProgressBar
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${title}: решено задач`}
      />
      <span className="prep-card__done">
        {solved} из {total}
      </span>
    </span>
  );
}
