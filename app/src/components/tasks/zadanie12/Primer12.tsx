'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FigureZoom } from '@/components/ui';
import { SHAPKA12 } from '@/content/zadanie12';
import { ZADANIYA } from '@/lib/paths';
import type { Primer12 as Dannye } from '@/lib/ves12/trening/primer';
import { ShagiResheniya } from '../steklo';

export interface Primer12Props {
  opasnoHtml?: string | undefined;
  trenirovatHref: string;
  opornyeHref: string;
}

/**
 * Разобранный пример типа №12 на карте «О задании»: условие, чертёж
 * движка, решение по шагам, «Где теряют балл», ответ и две кнопки.
 *
 * Чертёж закреплён рядом с шагами (как у №3): на широком экране он слева,
 * шаги справа; на телефоне он закреплён сверху, не выше трети экрана, и
 * сворачивается кнопкой, если мешает читать. Сам чертёж — как его
 * строит движок; по нажатию открывается во весь экран.
 */
export function Primer12({
  primer,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: Primer12Props & { primer: Dannye }) {
  const [svernut, setSvernut] = useState(false);
  return (
    <div className="kz-primer z12-primer">
      <p className="kz-primer__metka">{SHAPKA12.primer}</p>
      <div className="kz-uslovie" dangerouslySetInnerHTML={{ __html: primer.uslovieHtml }} />
      <div className={clsx('z12-primer__telo', primer.chertezhSvg === null && 'bez-chertezha')}>
        {primer.chertezhSvg === null ? null : (
          <div className={clsx('z12-primer__chertezh', svernut && 'is-svernut')}>
            <div hidden={svernut}>
              <FigureZoom className="chart z12-chertezh" label={SHAPKA12.chertezh}>
                <span dangerouslySetInnerHTML={{ __html: primer.chertezhSvg }} />
              </FigureZoom>
            </div>
            <button
              type="button"
              className="stk-ssylka z12-primer__svernut"
              aria-expanded={!svernut}
              onClick={() => setSvernut(!svernut)}
            >
              {svernut ? SHAPKA12.razvernut : SHAPKA12.svernut}
            </button>
          </div>
        )}
        <div className="z12-primer__reshenie">
          <ShagiResheniya
            className="z12-shagi"
            shagi={primer.shagi.map((s) => ({
              chtoHtml: s.chtoHtml,
              formulaHtml: '',
              ...(s.zagolovokHtml === '' ? {} : { zagolovokHtml: s.zagolovokHtml }),
              ...(s.ton === undefined ? {} : { ton: s.ton }),
            }))}
          />
          {opasnoHtml === undefined ? null : (
            <p className="kz-lovushka">
              <b>{SHAPKA12.lovushka}.</b> <span dangerouslySetInnerHTML={{ __html: opasnoHtml }} />
            </p>
          )}
          <p className="kz-otvet">
            {SHAPKA12.otvet}: <b dangerouslySetInnerHTML={{ __html: primer.otvetHtml }} />
          </p>
          <div className="kz-knopki">
            {/* Обычная ссылка: тренажёр читает тип из адреса при входе. */}
            <a className="stk-btn stk-btn--primary" href={trenirovatHref}>
              {SHAPKA12.trenirovat}
            </a>
            <Link className="stk-btn stk-btn--tihaya" href={opornyeHref}>
              {SHAPKA12.opornye}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const KESH = new Map<string, Promise<Dannye | null>>();

function zagruzit(nabor: string, versiya: string): Promise<Dannye | null> {
  const klyuch = `${nabor}:${versiya}`;
  let p = KESH.get(klyuch);
  if (p === undefined) {
    p = fetch(`${ZADANIYA}/12/dannye/primer/${nabor}.json?v=${versiya}`).then((r) => {
      if (!r.ok) throw new Error(`primer ${nabor}: ${r.status}`);
      return r.json() as Promise<Dannye | null>;
    });
    p.catch(() => {
      KESH.delete(klyuch);
    });
    KESH.set(klyuch, p);
  }
  return p;
}

/**
 * Пример, который приезжает файлом сборки, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: 42 примера
 * с чертежами в странице весили бы мегабайты.
 */
export function PrimerLazy12({
  nabor,
  versiya,
  ...props
}: Primer12Props & { nabor: string; versiya: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Dannye | null | 'net'>(null);

  useEffect(() => {
    const details = anchor.current?.closest('details');
    if (details === null || details === undefined) return undefined;
    let alive = true;
    let started = false;
    const load = () => {
      if (started || !details.open) return;
      started = true;
      zagruzit(nabor, versiya).then(
        (ready) => {
          if (alive) setPrimer(ready ?? 'net');
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
  }, [nabor, versiya]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA12.primerZhdyot : SHAPKA12.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <Primer12 primer={primer} {...props} />
    </div>
  );
}
