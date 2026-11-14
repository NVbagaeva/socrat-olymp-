'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA11 } from '@/content/tekstovye11';
import type { Primer11 } from './primer11Klient';

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: решатель
 * и KaTeX для 68 примеров грузятся отдельным куском по первому
 * раскрытию, а не вместе со страницей (как у №8, №7 и №6).
 */
export function PrimerLazy11({
  prototype,
  klyuch,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
  risunok,
}: {
  prototype: string;
  /** Ключ задачи-примера в банке (выбирает сервер). */
  klyuch: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
  /** Картинка к задаче (сервер): есть — ставится между условием и шагами. */
  risunok?: ReactNode;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer11 | null | 'net'>(null);

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
      void import('./primer11Klient')
        .then((mod) => mod.primer11(prototype, klyuch))
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
        <p className="stk-lead">{primer === null ? SHAPKA11.primerZhdyot : SHAPKA11.primerNet}</p>
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
        labels={SHAPKA11}
      />
    </div>
  );
}
