'use client';

import { ProgressBar } from '@/components/ui';
import { OPORNYE_9 } from '@/content/proizvodnaya';
import { prep9Solved, usePrep9Progress } from '@/lib/proizvodnaya/prepProgress';

export interface Opornye9CounterProps {
  totals: { id: string; total: number }[];
}

/** Строка «N из 60 заданий» и полоса под ней: счёт из хранилища браузера. */
export function Opornye9Counter({ totals }: Opornye9CounterProps) {
  const progress = usePrep9Progress();
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce((sum, item) => sum + prep9Solved(progress, item.id, item.total), 0);
  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} заданий
      </p>
      <ProgressBar
        className="prep__meter"
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${OPORNYE_9.title}: решено ${solved} из ${total}`}
      />
    </>
  );
}

/** Полоса и строка «N из 10» на карточке блока. */
export function Opornye9Meter({ id, total, title }: { id: string; total: number; title: string }) {
  const progress = usePrep9Progress();
  const solved = prep9Solved(progress, id, total);
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
