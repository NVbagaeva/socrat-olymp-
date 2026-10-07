'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { ProgressBar } from '@/components/ui';
import { O_ZADANII_11 } from '@/content/zadanie11';
import { plural } from '@/lib/plural';
import { trenazher11 } from '@/lib/zadanie11/progress';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { IkonkaRazdela, Piktogramma, tsvetRazdela, Zvezdy } from './Piktogrammy';

export interface KartaPunkt {
  id: SectionId;
  nazvanie: string;
  /** Число подтипов раздела. */
  tipov: number;
  /** Подтипы — по ним считается «решено N%». */
  subtypes: string[];
  maxLevel: Level;
  razminka: boolean;
  /** Опорных блоков у раздела: свои и те, что нужны перед ним. */
  blokov: number;
  hrefTeoriya: string;
  /** Нет блоков — кнопки нет. */
  hrefOpornye: string | null;
  hrefTrenazher: string;
}

/**
 * Карта разделов на вкладке «О задании»: девять карточек в порядке
 * изучения, соединённых пунктирной дорожкой (на широком экране —
 * змейкой по три в ряд, на телефоне — компактным столбиком).
 *
 * Карточка раскрывается во вступление раздела: что это, зачем и где
 * на ЕГЭ, главное — тело приходит с сервера готовой разметкой
 * (vstupleniya) — и «Теперь — задачи» с переходами в теорию, опорные
 * блоки и тренажёр. На широком экране вступление встаёт под рядом,
 * на телефоне — прямо под карточкой.
 *
 * «Решено N%» — доля подтипов раздела, решённых в тренажёре хоть раз
 * верно; на сервере хранилища нет, и первая отрисовка показывает ноль.
 */
export function KartaRazdelov11({
  punkty,
  vstupleniya,
}: {
  punkty: KartaPunkt[];
  vstupleniya: Record<SectionId, ReactNode>;
}) {
  const progress = trenazher11.useProgress();
  const [otkryt, setOtkryt] = useState<SectionId | null>(null);
  const ryady: KartaPunkt[][] = [];
  punkty.forEach((p, i) => {
    if (i % 3 === 0) {
      ryady.push([]);
    }
    ryady[ryady.length - 1]?.push(p);
  });
  let nomer = 0;

  function Vstuplenie({ p, mesto }: { p: KartaPunkt; mesto: 'pc' | 'mob' }) {
    const { vstup } = O_ZADANII_11;
    return (
      <div
        className={clsx('z11-vstup', `z11-vstup--${mesto}`, tsvetRazdela(p.id))}
        id={mesto === 'pc' ? `z11-vstup-${p.id}` : undefined}
        role="region"
        aria-label={`${p.nazvanie}: вступление`}
      >
        <div className="z11-vstup__head">
          <IkonkaRazdela section={p.id} className="z11-vstup__ikonka" />
          <span className="z11-vstup__name">
            <b>{p.nazvanie}</b>
            <span className="z11-vstup__meta">
              {p.tipov} {plural(p.tipov, ...O_ZADANII_11.tipov)}
              {p.razminka ? ` · ${O_ZADANII_11.razminka}` : ''} · {vstup.slozhnostDo}{' '}
              <Zvezdy level={p.maxLevel} section={p.id} />
            </span>
          </span>
          <button
            type="button"
            className="z11-vstup__close"
            onClick={() => setOtkryt(null)}
            aria-label={vstup.svernut}
          >
            <Piktogramma name="close" />
          </button>
        </div>
        {vstupleniya[p.id]}
        <div className="z11-vstup__teper">
          <p className="z11-vstup__label">{vstup.teper}</p>
          <div className="z11-vstup__btns">
            <Link className="btn btn--secondary btn--sm" href={p.hrefTeoriya}>
              <Piktogramma name="book" />
              {vstup.teoriya}
            </Link>
            {p.hrefOpornye === null ? null : (
              <Link className="btn btn--secondary btn--sm" href={p.hrefOpornye}>
                <Piktogramma name="tools" />
                {vstup.opornye}: {p.blokov} {plural(p.blokov, ...O_ZADANII_11.blokov)}
              </Link>
            )}
            <Link className="btn btn--primary btn--sm" href={p.hrefTrenazher}>
              <Piktogramma name="play" />
              {vstup.reshat}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="z11-map">
      {ryady.map((ryad, r) => {
        const vRyadu = ryad.find((p) => p.id === otkryt);
        return (
          <div className="z11-map__group" key={r}>
            <ol className="z11-map__row" start={r * 3 + 1}>
              {ryad.map((p) => {
                nomer += 1;
                const resheno = p.subtypes.filter(
                  (id) => (progress.kinds[id]?.right ?? 0) > 0,
                ).length;
                const pct =
                  p.subtypes.length === 0 ? 0 : Math.round((resheno / p.subtypes.length) * 100);
                const open = otkryt === p.id;
                return (
                  <li
                    className={clsx(
                      'z11-map__item',
                      tsvetRazdela(p.id),
                      p.razminka && 'is-razminka',
                      open && 'is-open',
                    )}
                    key={p.id}
                  >
                    <button
                      type="button"
                      className="z11-map__card"
                      aria-expanded={open}
                      aria-controls={`z11-vstup-${p.id}`}
                      onClick={() => setOtkryt(open ? null : p.id)}
                    >
                      <span className="z11-map__no" aria-hidden="true">
                        {nomer}
                      </span>
                      <IkonkaRazdela section={p.id} className="z11-map__icon" />
                      <span className="z11-map__body">
                        <span className="z11-map__title">{p.nazvanie}</span>
                        <span className="z11-map__count">
                          {p.tipov} {plural(p.tipov, ...O_ZADANII_11.tipov)}
                          {p.razminka ? ` · ${O_ZADANII_11.razminka}` : ''}
                        </span>
                        <ProgressBar
                          className="z11-map__bar"
                          value={pct}
                          label={`${p.nazvanie}: ${O_ZADANII_11.resheno(pct)}`}
                        />
                        <span className="z11-map__pct">{O_ZADANII_11.resheno(pct)}</span>
                        <span className="z11-map__stars" title={O_ZADANII_11.slozhnost}>
                          <Zvezdy level={p.maxLevel} section={p.id} />
                        </span>
                      </span>
                      <Piktogramma name="chevron" className="z11-map__chev" />
                    </button>
                    {open ? <Vstuplenie p={p} mesto="mob" /> : null}
                  </li>
                );
              })}
            </ol>
            {vRyadu === undefined ? null : <Vstuplenie p={vRyadu} mesto="pc" />}
            {r < ryady.length - 1 ? <span className="z11-map__turn" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
  );
}
