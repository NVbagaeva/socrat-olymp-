'use client';

import { Button, ProgressRing } from '@/components/ui';
import type { ProgressStore } from '@/lib/progressStore';
import { summarize } from '@/lib/trainerProgress';
import { METODY_4 } from '@/lib/veroyatnost/model';

export interface ProgressMetodyProps {
  store: ProgressStore;
  slova: {
    title: string;
    lead: string;
    ring: string;
    pusto: string;
    sbros: string;
  };
}

/**
 * Прогресс по методам: кольцо с долей верных и пять счётчиков.
 * Один блок на тренажёр и на «Узнай метод» — у каждого своё
 * хранилище и свои слова, устройство одно.
 */
export function ProgressMetody({ store, slova }: ProgressMetodyProps) {
  const progress = store.useProgress();
  const svod = summarize(progress);

  return (
    <section className="z4-progress" aria-labelledby={`${store.key}-title`}>
      <div className="z4-progress__text">
        <h3 className="z4-progress__title" id={`${store.key}-title`}>
          {slova.title}
        </h3>
        <p className="z4-progress__lead">{slova.lead}</p>
        {svod.done === 0 ? (
          <p className="z4-progress__empty">{slova.pusto}</p>
        ) : (
          <Button variant="ghost" size="sm" onClick={store.reset}>
            {slova.sbros}
          </Button>
        )}
      </div>

      <ProgressRing
        className="z4-progress__ring"
        value={svod.accuracy ?? 0}
        label={slova.ring}
        srLabel={`${slova.ring}: ${svod.right} из ${svod.done}`}
      />

      <ul className="z4-progress__metody">
        {METODY_4.map((m) => {
          const tally = progress.kinds[m.id];
          return (
            <li key={m.id} className="z4-progress__metod">
              <span className="z4-progress__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="z4-progress__name">{m.nazvanie}</span>
              <span className="z4-progress__count">
                <b>{tally?.right ?? 0}</b> / {tally?.done ?? 0}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
