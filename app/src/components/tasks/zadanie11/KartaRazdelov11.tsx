'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { ProgressBar } from '@/components/ui';
import { O_ZADANII_11 } from '@/content/zadanie11';
import { plural } from '@/lib/plural';
import { trenazher11 } from '@/lib/zadanie11/progress';
import type { Level, SectionId } from '@/lib/zadanie11/types';
import { IkonkaRazdela, tsvetRazdela, Zvezdy } from './Piktogrammy';

export interface KartaPunkt {
  id: SectionId;
  nazvanie: string;
  /** Число подтипов раздела. */
  tipov: number;
  /** Подтипы — по ним считается «решено N%». */
  subtypes: string[];
  maxLevel: Level;
  href: string;
  razminka: boolean;
}

/**
 * Карта разделов на вкладке «О задании»: девять карточек в порядке
 * изучения, соединённых пунктирной дорожкой (на широком экране —
 * змейкой по три в ряд, на телефоне — столбиком). «Решено N%» —
 * доля подтипов раздела, решённых в тренажёре хоть раз верно;
 * на сервере хранилища нет, и первая отрисовка показывает ноль.
 */
export function KartaRazdelov11({ punkty }: { punkty: KartaPunkt[] }) {
  const progress = trenazher11.useProgress();
  const ryady: KartaPunkt[][] = [];
  punkty.forEach((p, i) => {
    if (i % 3 === 0) {
      ryady.push([]);
    }
    ryady[ryady.length - 1]?.push(p);
  });
  let nomer = 0;
  return (
    <div className="z11-map">
      {ryady.map((ryad, r) => (
        <div className="z11-map__group" key={r}>
          <ol className="z11-map__row" start={r * 3 + 1}>
            {ryad.map((p) => {
              nomer += 1;
              const resheno = p.subtypes.filter(
                (id) => (progress.kinds[id]?.right ?? 0) > 0,
              ).length;
              const pct =
                p.subtypes.length === 0 ? 0 : Math.round((resheno / p.subtypes.length) * 100);
              return (
                <li
                  className={clsx('z11-map__item', tsvetRazdela(p.id), p.razminka && 'is-razminka')}
                  key={p.id}
                >
                  <Link className="z11-map__card" href={p.href}>
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
                        <Zvezdy level={p.maxLevel} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {r < ryady.length - 1 ? <span className="z11-map__turn" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}
