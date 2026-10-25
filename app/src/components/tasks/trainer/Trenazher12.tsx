'use client';

import { useMemo, type ReactNode } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { Filtr, TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { useTrainerProgress } from '@/lib/trainerProgress';
import { readTrainerRecipe } from './trainerPayload';
import { KARTOCHKA_12 } from './Zadacha12';

export interface Trenazher12Props {
  config: TrenazherConfig;
  refs: ZadachaRef[];
  start?: Filtr | null;
  backHref: string;
  ssylki: Record<string, SsylkiTipa>;
  /** Под панелью фильтров: сводка сделанного по разделу. */
  pod?: ReactNode;
}

/**
 * Тренировка, начатая прежним экраном №12 (до фильтров): рецепты
 * «набор, seed, задача» становятся заданиями с тем же seed — задачи
 * собираются те же, отметки ученика остаются на местах.
 */
function perenos12(packed: unknown): TrenPayload | null {
  const recipe = readTrainerRecipe(packed);
  return recipe === null
    ? null
    : {
        v: 1,
        filtr: '',
        rezhim: recipe.control ? 'bez' : 'podskazki',
        seed: 'perenos',
        items: recipe.tasks.map((t) => ({ k: t.id, seed: t.seed })),
      };
}

/** Тренажёр №12 на общей панели фильтров: статистика — из прогресса тренажёра. */
export function Trenazher12({
  config,
  refs,
  start = null,
  backHref,
  ssylki,
  pod,
}: Trenazher12Props) {
  const progress = useTrainerProgress();
  const stat = useMemo(
    () => ({ resheno: new Set(progress.solved ?? []), oshibki: new Set(progress.mistakes) }),
    [progress],
  );
  return (
    <>
      <Trenazher
        config={config}
        refs={refs}
        kartochka={KARTOCHKA_12}
        stat={stat}
        start={start}
        backHref={backHref}
        ssylki={ssylki}
        perenos={perenos12}
      />
      {pod === undefined ? null : <div className="trz-pod">{pod}</div>}
    </>
  );
}
