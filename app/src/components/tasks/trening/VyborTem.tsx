'use client';

import { clsx } from 'clsx';
import { useId } from 'react';
import { Ikonka, Znak } from '../steklo';
import type { GruppaVybora } from './types';

export interface VyborTemLabels {
  title: string;
  vse: string;
  nichego: string;
  skolko: string;
  bezKonca: string;
  taymer: string;
  sTaymerom: string;
  bezTaymera: string;
  bezPodskazok: string;
  bezPodskazokLead: string;
  nachat: string;
  nazad: string;
  pusto: string;
  itog: (tipov: number, zadach: number | null, taymer: boolean) => string;
}

export interface VyborTemProps {
  gruppy: GruppaVybora[];
  /** Выбранные типы. */
  selected: ReadonlySet<string>;
  onSelected: (next: Set<string>) => void;
  counts: (number | null)[];
  count: number | null;
  onCount: (count: number | null) => void;
  timer: boolean;
  onTimer: (timer: boolean) => void;
  bezPodskazok: boolean;
  onBezPodskazok: (value: boolean) => void;
  onStart: () => void;
  onBack?: () => void;
  labels: VyborTemLabels;
}

/**
 * Выбор тем: строки групп с галочкой, под выбранной группой — чипы её
 * типов; число задач, таймер, «без подсказок». Нажатие на группу
 * выбирает или снимает все её типы; чип — один тип.
 */
export function VyborTem({
  gruppy,
  selected,
  onSelected,
  counts,
  count,
  onCount,
  timer,
  onTimer,
  bezPodskazok,
  onBezPodskazok,
  onStart,
  onBack,
  labels,
}: VyborTemProps) {
  const uid = useId();
  const all = gruppy.flatMap((g) => g.tipy.map((t) => t.id));
  const chosen = all.filter((id) => selected.has(id)).length;

  function toggleTip(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelected(next);
  }

  function toggleGruppa(g: GruppaVybora) {
    const ids = g.tipy.map((t) => t.id);
    const allOn = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
    onSelected(next);
  }

  return (
    <section className="trn-vybor stk-glass" aria-labelledby={`${uid}-title`}>
      <div className="trn-vybor__verh">
        {onBack === undefined ? null : (
          <button
            type="button"
            className="stk-kruglaya stk-kruglaya--tihaya trn-vybor__nazad"
            onClick={onBack}
            aria-label={labels.nazad}
          >
            <Ikonka name="nazad" />
          </button>
        )}
        <h3 className="stk-h4" id={`${uid}-title`}>
          {labels.title}
        </h3>
        <span className="trn-vybor__vse">
          <button type="button" className="stk-ssylka" onClick={() => onSelected(new Set(all))}>
            {labels.vse}
          </button>
          <button type="button" className="stk-ssylka" onClick={() => onSelected(new Set())}>
            {labels.nichego}
          </button>
        </span>
      </div>

      <ul className="trn-stroki">
        {gruppy.map((g) => {
          const ids = g.tipy.map((t) => t.id);
          const on = ids.filter((id) => selected.has(id)).length;
          const allOn = on === ids.length;
          return (
            <li className={clsx('trn-stroka', on > 0 && 'is-on')} key={g.id}>
              <button
                type="button"
                className="trn-stroka__gruppa"
                aria-pressed={allOn}
                onClick={() => toggleGruppa(g)}
              >
                <span
                  className={clsx('trn-galka', allOn && 'is-on', on > 0 && !allOn && 'is-part')}
                  aria-hidden="true"
                />
                <Znak html={g.znakHtml} figura={g.znak} ton={g.ton} size="sm" />
                <b>{g.nazvanie}</b>
                <span className="trn-chip__n">
                  {on > 0 && !allOn ? `${on} / ${ids.length}` : ids.length}
                </span>
              </button>
              {on > 0 ? (
                <div className="trn-chipy" role="group" aria-label={g.nazvanie}>
                  {g.tipy.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={clsx('trn-chip', selected.has(t.id) && 'is-on')}
                      aria-pressed={selected.has(t.id)}
                      onClick={() => toggleTip(t.id)}
                      dangerouslySetInnerHTML={{ __html: t.nazvanieHtml }}
                    />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="trn-nastroyki">
        <div>
          <p className="stk-podpis" id={`${uid}-count`}>
            {labels.skolko}
          </p>
          <div className="trn-seg" role="group" aria-labelledby={`${uid}-count`}>
            {counts.map((n) => (
              <button
                type="button"
                key={n ?? 'inf'}
                className={clsx(count === n && 'is-on')}
                aria-pressed={count === n}
                onClick={() => onCount(n)}
              >
                {n === null ? labels.bezKonca : n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="stk-podpis" id={`${uid}-timer`}>
            {labels.taymer}
          </p>
          <div className="trn-seg" role="group" aria-labelledby={`${uid}-timer`}>
            <button
              type="button"
              className={clsx(timer && 'is-on')}
              aria-pressed={timer}
              onClick={() => onTimer(true)}
            >
              {labels.sTaymerom}
            </button>
            <button
              type="button"
              className={clsx(!timer && 'is-on')}
              aria-pressed={!timer}
              onClick={() => onTimer(false)}
            >
              {labels.bezTaymera}
            </button>
          </div>
        </div>
        <label className="trn-pereklyuchatel">
          <input
            type="checkbox"
            checked={bezPodskazok}
            onChange={(e) => onBezPodskazok(e.target.checked)}
          />
          <span className="trn-pereklyuchatel__ruchka" aria-hidden="true" />
          <span className="trn-pereklyuchatel__text">
            <b>{labels.bezPodskazok}</b>
            <span>{labels.bezPodskazokLead}</span>
          </span>
        </label>
      </div>

      <div className="trn-vybor__niz">
        <p className="trn-vybor__itog" aria-live="polite">
          {chosen === 0 ? labels.pusto : labels.itog(chosen, count, timer)}
        </p>
        <button
          type="button"
          className="stk-btn stk-btn--primary stk-btn--lg trn-vybor__start"
          onClick={onStart}
          disabled={chosen === 0}
        >
          {labels.nachat}
        </button>
      </div>
    </section>
  );
}
