'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA6 } from '@/content/sluchainye6';
import type { Primer6 } from './primer6Klient';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: решатель
 * и KaTeX для 15 примеров грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей (как у №8 и №7).
 */
export function PrimerLazy6({
  prototype,
  klyuch,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  prototype: string;
  /** Ключ задачи-примера в банке (выбирает сервер). */
  klyuch: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer6 | null | 'net'>(null);

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
      void import('./primer6Klient')
        .then((mod) => mod.primer6(prototype, klyuch))
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
        <p className="stk-lead">{primer === null ? SHAPKA6.primerZhdyot : SHAPKA6.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={primer.uslovieHtml}
        {...(primer.risunok === undefined ? {} : { risunok: primer.risunok })}
        shagi={primer.shagi}
        otvet={primer.otvet}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={SHAPKA6}
      />
    </div>
  );
}
