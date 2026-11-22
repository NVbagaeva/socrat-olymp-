'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../karta';
import { SHAPKA13 } from '@/content/ekonomicheskie13';
import type { Primer13 } from '@/lib/zadanie13/primer';
import { shagi13 } from './shagi13';

/** Таблица условия (график долга) примера: прежней разметкой, прокрутка — внутри. */
export function TablitsaUsloviya13({ html }: { html: string }) {
  return <div className="z13-reshenie" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Разобранный пример типа на карте: условие, таблица условия, шаги, ответ, «Где теряют балл». */
export function Primer13Karta({
  primer,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  primer: Primer13;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  return (
    <KartaPrimer
      uslovieHtml={primer.uslovieHtml}
      {...(primer.tablitsaHtml === null
        ? {}
        : { risunok: <TablitsaUsloviya13 html={primer.tablitsaHtml} /> })}
      shagi={shagi13(primer.shagi)}
      otvet={primer.otvet}
      opasnoHtml={opasnoHtml}
      trenirovatHref={trenirovatHref}
      opornyeHref={opornyeHref}
      labels={SHAPKA13}
    />
  );
}

/**
 * Пример типа, который собирается в браузере, когда ученик раскрывает
 * карточку (<details>). До этого в разметке только заглушка: движок задач
 * и KaTeX для 66 примеров грузятся отдельным куском по первому раскрытию,
 * а не вместе со страницей (как у №6 и №7).
 */
export function PrimerLazy13({
  prototype,
  seed,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  prototype: string;
  /** Seed задачи-примера (выбирает сервер). */
  seed: string;
  opasnoHtml: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [primer, setPrimer] = useState<Primer13 | null | 'net'>(null);

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
      void import('@/lib/zadanie13/primer')
        .then((mod) => mod.primer13(prototype, seed))
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
  }, [prototype, seed]);

  if (primer === null || primer === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={primer === null}>
        <p className="stk-lead">{primer === null ? SHAPKA13.primerZhdyot : SHAPKA13.primerNet}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <Primer13Karta
        primer={primer}
        opasnoHtml={opasnoHtml}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
      />
    </div>
  );
}
