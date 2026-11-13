'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA2 } from '@/content/vektory2';
import type { Primer2 } from './primer2';
import { RisunokSvg } from './shagi2';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: генератор,
 * движок рисунков и KaTeX грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей (как у №8, №7 и №6).
 */
export function PrimerLazy2({
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
  const [primer, setPrimer] = useState<Primer2 | null | 'net'>(null);

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
      void import('./primer2')
        .then((mod) => mod.primer2(prototype))
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
  }, [prototype]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA2.primerZhdyot : SHAPKA2.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={primer.uslovieHtml}
        {...(primer.risunokSvg === null
          ? {}
          : { risunok: <RisunokSvg svg={primer.risunokSvg} /> })}
        shagi={primer.shagi}
        otvet={primer.otvet}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={SHAPKA2}
      />
    </div>
  );
}
