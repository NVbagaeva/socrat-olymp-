'use client';

import { clsx } from 'clsx';
import { useId, useState } from 'react';
import { Button, ProgressBar, ProgressRing } from '@/components/ui';
import { TRENAZHER_SLOVA, type Zadanie } from '@/content/veroyatnost';
import type { ProgressStore } from '@/lib/progressStore';
import { summarize } from '@/lib/trainerProgress';
import { MetodIkonka } from './MetodIkonka';
import type { Navyk } from './metody';

export interface ProgressPoMetodamProps {
  zadanie: Zadanie;
  /** Хранилище тренажёра и хранилище «Узнай метод». */
  store: ProgressStore;
  uznayStore: ProgressStore;
  /** Какие методы считать: семь у задания №4, десять у задания №5. */
  metody: readonly Navyk[];
}

type Vid = 'trenazher' | 'uznay';

/**
 * «Мой прогресс по методам» — по макету тренажёра: кольцо с долей
 * верных и строка на каждый метод (значок, название, полоса, «верно /
 * закрыто»). Переключатель справа показывает то же для режима «Узнай
 * метод»: у него своё хранилище, и верно там — узнанный метод, а не
 * решённая задача.
 */
export function ProgressPoMetodam({ zadanie, store, uznayStore, metody }: ProgressPoMetodamProps) {
  const slova = TRENAZHER_SLOVA.progress;
  const id = useId();
  const [vid, setVid] = useState<Vid>('trenazher');
  const trenazher = store.useProgress();
  const uznay = uznayStore.useProgress();
  const progress = vid === 'trenazher' ? trenazher : uznay;
  const tekushchiy = vid === 'trenazher' ? store : uznayStore;
  const svod = summarize(progress);
  const ring = vid === 'trenazher' ? slova.ring : slova.ringUznay;

  return (
    <section className="vtr-progress" aria-labelledby={`${id}-title`}>
      <header className="vtr-progress__head">
        <div className="vtr-progress__text">
          <h3 className="vtr-progress__title" id={`${id}-title`}>
            {slova.title}
          </h3>
          <p className="vtr-progress__lead">
            {vid === 'trenazher' ? slova.lead : slova.leadUznay}
          </p>
        </div>
        {/* Переключатель двух сводок: кнопки-вкладки одной плашкой. */}
        <div className="vtr-switch" role="tablist" aria-label={slova.title}>
          {(['trenazher', 'uznay'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={vid === item}
              className={clsx('vtr-switch__btn', vid === item && 'is-active')}
              onClick={() => setVid(item)}
            >
              {item === 'trenazher' ? slova.trenazher : slova.uznay}
            </button>
          ))}
        </div>
      </header>

      <div className="vtr-progress__body">
        <div className="vtr-progress__ring">
          <ProgressRing
            value={svod.accuracy ?? 0}
            label={ring}
            srLabel={`${ring}: ${svod.right} из ${svod.done}`}
          />
          {svod.done === 0 ? (
            <p className="vtr-progress__empty">{slova.pusto}</p>
          ) : (
            <Button variant="ghost" size="sm" onClick={tekushchiy.reset}>
              {slova.sbros}
            </Button>
          )}
        </div>

        <ul className="vtr-progress__metody">
          {metody.map((m) => {
            const tally = progress.kinds[m.id];
            const done = tally?.done ?? 0;
            const right = tally?.right ?? 0;
            return (
              <li key={m.id} className="vtr-progress__metod">
                <MetodIkonka zadanie={zadanie} metod={m.id} size="sm" />
                <span className="vtr-progress__name">{m.nazvanie}</span>
                <ProgressBar
                  className="vtr-progress__bar"
                  value={done === 0 ? 0 : (right / done) * 100}
                  label={`${m.nazvanie}: ${ring} ${right} из ${done}`}
                />
                <span className="vtr-progress__count" aria-hidden="true">
                  <b>{right}</b> / {done}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
