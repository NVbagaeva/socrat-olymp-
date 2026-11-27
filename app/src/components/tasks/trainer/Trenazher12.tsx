'use client';

import { VDomashkuTrenazher, katalogIzGrupp } from '@/components/dz2/knopki';
import { vDomashku12 } from '@/lib/ves12/vDomashku12';
import { useMemo, type ReactNode } from 'react';
import { Trenazher } from '@/components/trenazher/Trenazher';
import type { SsylkiTipa } from '@/components/trenazher/types';
import type { TrenPayload } from '@/lib/trenazher/sessiya';
import type { Filtr, TrenazherConfig, ZadachaRef } from '@/lib/trenazher/types';
import { useTrainerProgress } from '@/lib/trainerProgress';
import { readTrainerRecipe } from './trainerPayload';
import { TrainerStats, type TrainerStatsProps } from './TrainerStats';
import { KARTOCHKA_12 } from './Zadacha12';

export interface Trenazher12Props {
  config: TrenazherConfig;
  refs: ZadachaRef[];
  start?: Filtr | null;
  backHref: string;
  ssylki: Record<string, SsylkiTipa>;
  /** Под панелью фильтров: сводка сделанного по разделу. */
  pod?: ReactNode;
  /**
   * Сводка по разделу под панелью, если pod не задан. Рисуется здесь, в
   * отложенном коде: в разметке страницы темы от неё только данные.
   */
  svodka?: TrainerStatsProps;
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
/** Название подтипа без формул — текстом в HTML каталога ДЗ. */
function ekran(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function Trenazher12({
  config,
  refs,
  start = null,
  backHref,
  ssylki,
  pod,
  svodka,
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
        ryadomSoStartom={(f) => {
          /* «В домашку» (этап 4е): выбранные типы (нет выбора — все типы
             вкладки), которые есть у адаптера ДЗ. */
          const vse = config.temy.flatMap((t) => t.podtipy.map((p) => p.id)).filter(vDomashku12);
          const tipy = f.tipy.length === 0 ? vse : f.tipy.filter(vDomashku12);
          return tipy.length === 0 ? null : (
            <VDomashkuTrenazher
              taskNo={12}
              tipy={tipy}
              vse={tipy.length === vse.length}
              katalog={katalogIzGrupp(
                config.temy.map((t) => ({
                  nazvanie: t.title,
                  tipy: t.podtipy.map((p) => ({ id: p.id, nazvanieHtml: p.titleHtml ?? ekran(p.title) })),
                })),
                vDomashku12,
              )}
            />
          );
        }}
      />
      {pod !== undefined ? (
        <div className="trz-pod">{pod}</div>
      ) : svodka !== undefined ? (
        <div className="trz-pod">
          <TrainerStats {...svodka} />
        </div>
      ) : null}
    </>
  );
}
