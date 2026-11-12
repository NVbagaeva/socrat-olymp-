'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA7 } from '@/content/uravneniya7';
import type { Primer7 } from './primer7Klient';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: решатель
 * и KaTeX для 34 примеров грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей (как у №8).
 */
export function PrimerLazy7({
  prototype,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  prototype: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer7 | null | 'net'>(null);

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
      void import('./primer7Klient')
        .then((mod) => mod.primer7(prototype))
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
  }, [prototype]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA7.primerZhdyot : SHAPKA7.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={primer.uslovieHtml}
        shagi={primer.shagi}
        otvet={primer.otvet}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={SHAPKA7}
      />
    </div>
  );
}
