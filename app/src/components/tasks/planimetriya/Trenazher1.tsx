'use client';

import { useMemo, useState } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import { progress1 } from '@/lib/planimetriya/progress';
import type { DannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import { perenestiPauzu1 } from '@/lib/planimetriya/trenazher/pauza';
import type { TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { kartochka1 } from './Zadacha1';

export interface Trenazher1Props {
  dannye: DannyeTrenazhera1;
  /** Конфиг фильтров и список задач — собраны на сборке (названия с формулами в KaTeX). */
  config: TrenazherConfig;
  refs: ZadachaRef[];
  base: string;
}

/**
 * Вкладка «Тренажёр» №1 на общей панели фильтров: блоки I–X — темы,
 * прототипы — чипы, ★–★★★, открытый банк или нет. Маршрут урока у
 * репетиторов (?tipy=p01,p05) открывает тренажёр с этими прототипами.
 * Пауза прежнего тренажёра переносится в общую сессию (pauza.ts).
 */
export function Trenazher1({ dannye, config, refs, base }: Trenazher1Props) {
  /* До первой отрисовки оболочки: прежняя пауза → запись сессии. */
  useState(() => {
    if (typeof window !== 'undefined') perenestiPauzu1();
    return null;
  });
  const kartochka = useMemo(
    () => kartochka1({ bank: dannye.bank, razdely: dannye.razdely, ssylki: dannye.ssylki, base }),
    [dannye, base],
  );
  const ssylki = useMemo(() => {
    const out: Record<string, SsylkiTipa> = {};
    for (const [id, s] of Object.entries(dannye.ssylki)) {
      out[id] = {
        ...(s.kartochka === '' ? {} : { teoriya: `${base}/teoriya/#k-${s.kartochka}` }),
        ...(s.opornyy === null ? {} : { opornye: `${base}/opornye-zadachi/${s.opornyy.slug}/` }),
      };
    }
    return out;
  }, [dannye, base]);
  const progress = progress1.useProgress();
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
      backHref={base}
      ssylki={ssylki}
    />
  );
}
