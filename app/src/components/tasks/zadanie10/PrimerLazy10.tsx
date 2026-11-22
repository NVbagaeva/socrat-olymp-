'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA10 } from '@/content/prikladnye10';
import type { Primer10 } from './primer10Klient';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке — картинка сюжета (её
 * рисует сервер) и заглушка: решатель и KaTeX для 34 примеров грузятся
 * отдельным куском по первому раскрытию, а не вместе со страницей
 * (как у №8, №7 и №6).
 */
export function PrimerLazy10({
  prototype,
  klyuch,
  risunok,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  prototype: string;
  /** Ключ задачи-примера в банке (выбирает сервер). */
  klyuch: string;
  /** Картинка сюжета и чертёж — готовая серверная разметка. */
  risunok?: ReactNode;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer10 | null | 'net'>(null);

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
      void import('./primer10Klient')
        .then((mod) => mod.primer10(prototype, klyuch))
        .then(
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
  }, [prototype, klyuch]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        {risunok === undefined ? null : <div className="kz-primer__risunok">{risunok}</div>}
        <p className="stk-lead">{primer === null ? SHAPKA10.primerZhdyot : SHAPKA10.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={primer.uslovieHtml}
        {...(risunok === undefined ? {} : { risunok })}
        shagi={primer.shagi}
        otvet={primer.otvet}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={SHAPKA10}
      />
    </div>
  );
}
