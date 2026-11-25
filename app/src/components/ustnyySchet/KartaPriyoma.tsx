'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PriyomId } from '@/lib/ustnyySchet/types';
import { USTNYY } from '@/content/ustnyySchet';
import { KoltsoPriyoma } from './VitrinaKlient';

const T = USTNYY.vitrina;

export interface KartaPriyomaProps {
  id: PriyomId;
  nazvanie: string;
  /** «Коротко» с формулами — готовый HTML (сервер). */
  kratkoHtml: string;
  /** Пример приёма в KaTeX (сервер): «45² = ?». */
  primerHtml: string;
  /** Короткая цепочка разбора этого примера (сервер). */
  razborHtml: string;
  uchitsyaHref: string;
  trenHref: string;
}

/** Есть ли у устройства наведение (компьютер): тогда оборот — по наведению. */
function useNavedenie(): boolean {
  const [est, setEst] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const upd = () => setEst(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);
  return est;
}

/**
 * Карточка приёма на витрине — переворачивается. Лицо: название,
 * коротко, пример из движка и мини-кольцо прогресса. Оборот: короткая
 * цепочка разбора и кнопки «Учиться →» и «Тренировать». На компьютере
 * оборот — по наведению, на телефоне — кнопкой «Как?»; с клавиатуры —
 * Enter или пробел на карточке, дальше Tab по кнопкам оборота. Скрытая
 * сторона — inert: её кнопки не ловят ни Tab, ни нажатия.
 */
export function KartaPriyoma({
  id,
  nazvanie,
  kratkoHtml,
  primerHtml,
  razborHtml,
  uchitsyaHref,
  trenHref,
}: KartaPriyomaProps) {
  const [oborot, setOborot] = useState(false);
  const navedenie = useNavedenie();
  const karta = useRef<HTMLDivElement>(null);
  const kak = useRef<HTMLButtonElement>(null);

  return (
    <div
      ref={karta}
      className={clsx('us-flip', oborot && 'is-oborot')}
      data-priyom={id}
      tabIndex={0}
      role="group"
      aria-roledescription="карточка"
      aria-label={nazvanie}
      onMouseEnter={() => navedenie && setOborot(true)}
      onMouseLeave={() => navedenie && setOborot(false)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) {
          if (e.key === 'Escape') {
            setOborot(false);
            karta.current?.focus();
          }
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOborot((o) => !o);
        } else if (e.key === 'Escape') setOborot(false);
      }}
    >
      <div className="us-flip__vnutri">
        <div className="us-flip__lico" inert={oborot}>
          <div className="us-flip__verh">
            <h4 className="us-flip__zag">{nazvanie}</h4>
            <KoltsoPriyoma id={id} />
          </div>
          <p className="us-flip__lead" dangerouslySetInnerHTML={{ __html: kratkoHtml }} />
          <p className="us-flip__primer" dangerouslySetInnerHTML={{ __html: primerHtml }} />
          <button
            ref={kak}
            type="button"
            className="btn btn--ghost btn--sm us-flip__kak"
            aria-label={T.perevernut(nazvanie)}
            onClick={() => setOborot(true)}
          >
            {T.kak}
          </button>
        </div>
        <div className="us-flip__oborot" inert={!oborot}>
          <p className="us-flip__zag us-flip__zag--oborot">{nazvanie}</p>
          <p className="us-flip__razbor" dangerouslySetInnerHTML={{ __html: razborHtml }} />
          <div className="us-flip__knopki">
            <Link className="btn btn--primary btn--sm" href={uchitsyaHref}>
              {T.uchitsya}
            </Link>
            <Link className="btn btn--secondary btn--sm" href={trenHref}>
              {T.trenirovat}
            </Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm us-flip__nazad"
              onClick={() => {
                setOborot(false);
                kak.current?.focus();
              }}
            >
              {T.nazad}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
