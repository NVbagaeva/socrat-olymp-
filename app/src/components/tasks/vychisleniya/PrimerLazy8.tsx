'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA8 } from '@/content/vychisleniya8';
import type { Primer8 } from './primer8Klient';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: генератор
 * и KaTeX для 25 примеров грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей.
 */
export function PrimerLazy8({
  prototype,
  trenirovatHref,
  opornyeHref,
}: {
  prototype: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer8 | null | 'net'>(null);

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
      void import('./primer8Klient').then((mod) => {
        if (alive) {
          setPrimer(mod.primer8(prototype) ?? 'net');
        }
      });
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
        <p className="stk-lead">{primer === null ? SHAPKA8.primerZhdyot : SHAPKA8.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={primer.uslovieHtml}
        shagi={primer.shagi}
        otvet={primer.otvet}
        opasnoHtml={primer.opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={SHAPKA8}
      />
    </div>
  );
}
