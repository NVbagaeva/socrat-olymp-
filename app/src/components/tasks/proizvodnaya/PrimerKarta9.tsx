'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { ShagiResheniya } from '../steklo';
import { SHAPKA9 } from '@/content/proizvodnaya9';
import { FiguraSvg9 } from './FiguraSvg9';
import type { Primer9Dannye, VidChertezha9 } from './primer9';

function podpisVida(v: VidChertezha9): string {
  return v.vid === 'uslovie'
    ? SHAPKA9.vidUsloviya
    : v.vid === 'vse'
      ? SHAPKA9.vidVse
      : SHAPKA9.vidShag(v.k ?? 1);
}

/**
 * Разобранный пример типа на вкладке «О задании» №9.
 *
 * Чертёж закреплён рядом с шагами решения (как у №3): на широком экране
 * он стоит слева, шаги справа; на телефоне он закреплён сверху и не выше
 * трети экрана, шаги прокручиваются под ним, кнопка сворачивает чертёж.
 * Над чертежом — что на нём показать: условие, построения по шагам
 * подсказки или все построения. У задач без рисунка — одна колонка.
 */
export function PrimerKarta9({
  primer,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  primer: Primer9Dannye;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const vidy = primer.chertezhi;
  /* Сначала — все построения: о них говорят шаги решения. */
  const [vid, setVid] = useState(Math.max(0, vidy.length - 1));
  const [svernut, setSvernut] = useState(false);
  const tekushchiy = vidy[vid];
  return (
    <div className={clsx('kz-primer z9-primer', vidy.length === 0 && 'z9-primer--bez')}>
      <p className="kz-primer__metka">{SHAPKA9.primer}</p>
      <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: primer.uslovieHtml }} />
      <div className="z9-primer__telo">
        {tekushchiy === undefined ? null : (
          <div className={clsx('z9-primer__chertezh', svernut && 'is-svernut')}>
            <div className="z9-primer__holst" hidden={svernut}>
              <FiguraSvg9 svg={tekushchiy.svg} label={SHAPKA9.risunok} />
            </div>
            <div className="z9-primer__panel">
              <div className="z9-primer__vidy" role="group" aria-label={SHAPKA9.vidy}>
                {vidy.map((v, i) => (
                  <button
                    type="button"
                    key={i}
                    className={clsx('z9-vid', i === vid && 'is-on')}
                    aria-pressed={i === vid}
                    onClick={() => {
                      setVid(i);
                      setSvernut(false);
                    }}
                  >
                    {podpisVida(v)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="stk-ssylka z9-primer__svernut"
                aria-expanded={!svernut}
                onClick={() => setSvernut(!svernut)}
              >
                {svernut ? SHAPKA9.razvernut : SHAPKA9.svernut}
              </button>
            </div>
          </div>
        )}
        <ShagiResheniya shagi={primer.shagi} className="z9-primer__shagi" />
      </div>
      <p className="kz-lovushka">
        <b>{SHAPKA9.lovushka}.</b> <span dangerouslySetInnerHTML={{ __html: opasnoHtml }} />
      </p>
      <p className="kz-otvet">
        {SHAPKA9.otvet}: <b>{primer.otvet}</b>
      </p>
      <div className="kz-knopki">
        {/* Обычные ссылки: тренажёр читает тип из адреса при входе. */}
        <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
          {SHAPKA9.trenirovat}
        </a>
        <a className="stk-btn stk-btn--tihaya" href={opornyeHref}>
          {SHAPKA9.opornye}
        </a>
      </div>
    </div>
  );
}

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: генератор,
 * движок чертежей и KaTeX грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей.
 */
export function PrimerKarta9Lazy({
  prototip,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  prototip: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer9Dannye | null | 'net'>(null);

  useEffect(() => {
    const details = anchor.current?.closest('details');
    if (details === null || details === undefined) {
      return undefined;
    }
    let alive = true;
    let started = false;
    const load = () => {
      if (started || !details.open) {
        return;
      }
      started = true;
      void import('./primer9')
        .then((mod) => mod.primer9(prototip))
        .then(
          (ready) => {
            if (alive) setPrimer(ready);
          },
          () => {
            if (alive) setPrimer('net');
          },
        );
    };
    load();
    details.addEventListener('toggle', load);
    return () => {
      alive = false;
      details.removeEventListener('toggle', load);
    };
  }, [prototip]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA9.primerZhdyot : SHAPKA9.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <PrimerKarta9
        primer={primer}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
      />
    </div>
  );
}
