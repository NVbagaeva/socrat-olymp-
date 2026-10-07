'use client';

import { ProgressBar } from '@/components/ui';
import { OPORNYE_11 } from '@/content/zadanie11';
import { mikroResheno11, opornye11 } from '@/lib/zadanie11/progress';

/** Строка «N из 120 задач» и полоса под ней: счёт из хранилища браузера. */
export function Opornye11Counter({ totals }: { totals: { id: string; total: number }[] }) {
  const progress = opornye11.useProgress();
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce(
    (sum, item) => sum + mikroResheno11(progress, item.id, item.total),
    0,
  );
  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} задач
      </p>
      <ProgressBar
        className="prep__meter"
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${OPORNYE_11.title}: решено ${solved} из ${total}`}
      />
    </>
  );
}
