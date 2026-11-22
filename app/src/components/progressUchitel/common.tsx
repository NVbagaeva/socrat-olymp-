'use client';

/** Общее для экранов прогресса: фильтры периода и задания, время с подсказкой, загрузка. */

import { clsx } from 'clsx';
import { useId } from 'react';
import { Tooltip } from '@/components/ui';
import { PROGRESS } from '@/content/progressUchitel';
import { ZHURNAL_RAZDELY } from '@/lib/zhurnal/config';
import { PERIODY, podpisRazdela, razdelyDlyaPokaza, vremya, type PeriodId } from '@/lib/zhurnal/vid';

export const zhurnalApi = () => import('@/lib/zhurnal/api');

export function errorCode(e: unknown): string {
  return e instanceof Error && 'code' in e ? String((e as { code: string }).code) : 'unknown';
}

/** Параметр адреса (страницы статические: читаем в браузере). */
export function param(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Активное время; общее — во всплывающей подсказке. */
export function Vremya({ active, total }: { active: number; total: number }) {
  return (
    <Tooltip content={PROGRESS.vremya.podskazka(vremya(total))}>
      <span className="pu-vremya">{vremya(active)}</span>
    </Tooltip>
  );
}

export function Filtry({
  period,
  onPeriod,
  taskNo,
  onTaskNo,
}: {
  period: PeriodId;
  onPeriod: (p: PeriodId) => void;
  taskNo: number | null;
  onTaskNo: (n: number | null) => void;
}) {
  const id = useId();
  return (
    <div className="pu-filtry">
      <div className="pu-chips" role="group" aria-label={PROGRESS.filtry.period}>
        {PERIODY.map((p) => (
          <button
            key={p.id}
            type="button"
            className={clsx('pu-chip', p.id === period && 'pu-chip--on')}
            aria-pressed={p.id === period}
            onClick={() => onPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="pu-select" htmlFor={id}>
        <span className="sr-only">{PROGRESS.filtry.razdel}</span>
        <select
          id={id}
          value={taskNo === null ? '' : String(taskNo)}
          onChange={(e) => onTaskNo(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">{PROGRESS.filtry.vse}</option>
          {razdelyDlyaPokaza(ZHURNAL_RAZDELY).map((n) => (
            <option key={n} value={n}>
              {podpisRazdela(n)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
