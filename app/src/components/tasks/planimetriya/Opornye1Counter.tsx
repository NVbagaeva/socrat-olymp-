'use client';

import { ProgressBar } from '@/components/ui';
import { OPORNYE_1 } from '@/content/zadanie1';
import { mikroResheno, opornye1 } from '@/lib/planimetriya/progress';

export interface Opornye1CounterProps {
  totals: { id: string; total: number }[];
}

/** Строка «N из 90 заданий» и полоса под ней: счёт из хранилища браузера. */
export function Opornye1Counter({ totals }: Opornye1CounterProps) {
  const progress = opornye1.useProgress();
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce((sum, item) => sum + mikroResheno(progress, item.id, item.total), 0);
  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} заданий
      </p>
      <ProgressBar
        className="prep__meter"
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${OPORNYE_1.trenirovkiTitle}: решено ${solved} из ${total}`}
      />
    </>
  );
}

/** Полоса и строка «N из 6» на карточке блока. */
export function Opornye1Meter({ id, total, title }: { id: string; total: number; title: string }) {
  const progress = opornye1.useProgress();
  const solved = mikroResheno(progress, id, total);
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
