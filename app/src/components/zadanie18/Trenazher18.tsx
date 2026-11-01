'use client';

import { useMemo } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import type { TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import type { Zadacha18 } from '@/lib/zadanie18/trenazher/bank';
import { trenazher18 } from '@/lib/zadanie18/trenazher/progress';
import { kartochka18 } from './Zadacha18';

export interface Trenazher18Props {
  config: TrenazherConfig;
  refs: ZadachaRef[];
  /** Банк собран на сервере: условия в KaTeX, ответы отпечатками. */
  bank: Zadacha18[];
  backHref: string;
  ssylki: Record<string, SsylkiTipa>;
}

/**
 * Вкладка «Тренажёр» №18 на общей панели фильтров: темы — группы
 * ключевых схем, чипы — схемы, уровни ★–★★★. Проверяется ответ пункта б);
 * пункт а) ученик сверяет с разбором.
 */
export function Trenazher18({ config, refs, bank, backHref, ssylki }: Trenazher18Props) {
  const kartochka = useMemo(() => kartochka18(bank), [bank]);
  const progress = trenazher18.useProgress();
  const stat = useMemo(
    () => ({
      resheno: new Set(
        Object.entries(progress.outcomes).flatMap(([k, v]) => (v === 'right' ? [k] : [])),
      ),
      oshibki: new Set(progress.mistakes),
    }),
    [progress],
  );
  return (
    <Trenazher
      config={config}
      refs={refs}
      kartochka={kartochka}
      stat={stat}
      backHref={backHref}
      ssylki={ssylki}
    />
  );
}
