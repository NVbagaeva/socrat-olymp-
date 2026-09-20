'use client';

import { OPORNYE } from '@/content/opornye';
import { ProgressBar } from '@/components/ui';
import { prep8Solved, usePrep8Progress } from '@/lib/vychisleniya/progress';

export interface Podgotovka8CounterProps {
  totals: { id: string; total: number }[];
}

/** Строка «N из 40 заданий» и полоса под ней: счёт из хранилища браузера. */
export function Podgotovka8Counter({ totals }: Podgotovka8CounterProps) {
  const progress = usePrep8Progress();
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce((sum, item) => sum + prep8Solved(progress, item.id, item.total), 0);
  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} заданий
      </p>
      <ProgressBar
        className="prep__meter"
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${OPORNYE.title}: решено ${solved} из ${total}`}
      />
    </>
  );
}

/** Полоса и строка «N из 8» на карточке блока. */
export function Podgotovka8Meter({
  id,
  total,
  title,
}: {
  id: string;
  total: number;
  title: string;
}) {
  const progress = usePrep8Progress();
  const solved = prep8Solved(progress, id, total);
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
