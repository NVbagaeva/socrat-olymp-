'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { renderPlan, shagovPodskazki } from '@/lib/planimetriya/render';
import type { Optsii, Rezhim, Scena } from '@/lib/planimetriya/types';

export interface ChertezhShagiProps {
  scena: Scena;
  /** Всё, кроме режима: вариант, числа, размер, alt. */
  optsii?: Omit<Optsii, 'rezhim'>;
  /** Показывать ли последним шагом лист учителя (решение). */
  sReshenie?: boolean;
}

/**
 * Чертёж с пошаговым появлением слоёв подсказки.
 *
 * Шаг 0 — рисунок условия (как на листе ученика), шаги 1…N — слои
 * подсказки: новый слой подсвечен и проявляется, прежние остаются.
 * Последний шаг (по желанию) — лист учителя со всеми построениями.
 */
export function ChertezhShagi({ scena, optsii, sReshenie = true }: ChertezhShagiProps) {
  const n = shagovPodskazki(scena);
  const max = n + (sReshenie ? 1 : 0);
  const [shag, setShag] = useState(0);
  const rezhim: Rezhim =
    shag === 0
      ? { rezhim: 'uchenik' }
      : shag <= n
        ? { rezhim: 'podskazka', shag }
        : { rezhim: 'uchitel' };
  const svg = renderPlan(scena, { ...optsii, rezhim });
  const podpis =
    shag === 0 ? 'Рисунок условия' : shag <= n ? `Подсказка ${shag} из ${n}` : 'Решение учителя';
  return (
    <div className="pl-shagi">
      <span key={shag} className="pl-wrap pl-anim" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="pl-shagi__knopki">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShag((s) => Math.max(0, s - 1))}
          disabled={shag === 0}
        >
          Назад
        </Button>
        <Button
          size="sm"
          onClick={() => setShag((s) => Math.min(max, s + 1))}
          disabled={shag === max}
        >
          {shag < n ? 'Следующая подсказка' : 'Показать решение'}
        </Button>
        <span className="pl-shagi__status t-sm" aria-live="polite">
          {podpis}
        </span>
      </div>
    </div>
  );
}
