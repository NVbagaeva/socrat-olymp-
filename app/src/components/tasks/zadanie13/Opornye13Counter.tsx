'use client';

import { ProgressBar } from '@/components/ui';
import { OPORNYE_13 } from '@/content/zadanie13';
import { opornye13, resheno13 } from '@/lib/zadanie13/progress';

/** Строка «N из 170 задач» и полоса под ней: счёт из хранилища браузера. */
export function Opornye13Counter({ totals }: { totals: { id: string; total: number }[] }) {
  const progress = opornye13.useProgress();
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const solved = totals.reduce((sum, item) => sum + resheno13(progress, item.id, item.total), 0);
  return (
    <>
      <p className="prep__counter">
        <b>{solved}</b> из {total} задач
      </p>
      <ProgressBar
        className="prep__meter"
        value={total === 0 ? 0 : (solved / total) * 100}
        label={`${OPORNYE_13.title}: решено ${solved} из ${total}`}
      />
    </>
  );
}
