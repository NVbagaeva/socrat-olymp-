'use client';

import { useEffect, useRef, useState } from 'react';
import { KartaPrimer } from '../../karta';
import { tekstyKarty45 } from '@/content/veroyatnost45';
import { razdelBase } from '@/lib/paths';
import { otkrytRazbor, type Razbor } from '@/lib/veroyatnost/razbor';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { Kartinka45, primerIzRazbora } from './Primer45';

/**
 * Пример типа №4 и №5, который раскрывается в браузере: условие и
 * картинка приходят разметкой сервера, а решение — закрытым файлом
 * только этого примера при выборе
 * карточки (<details>). Так страница не несёт разборы всех типов сразу.
 */
export function PrimerLazy45({
  zadanie,
  kind,
  seal,
  versiya,
  uslovieHtml,
  kartinka,
  opasnoHtml,
  trenirovatHref,
  opornyeHref,
}: {
  zadanie: Zadanie45;
  kind: string;
  seal: string;
  versiya: string;
  uslovieHtml: string;
  kartinka?: { path: string; alt: string };
  opasnoHtml?: string;
  trenirovatHref: string;
  opornyeHref: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [razbor, setRazbor] = useState<Razbor | null | 'net'>(null);

  useEffect(() => {
    const details = anchor.current?.closest('details');
    if (details === null || details === undefined) {
      return undefined;
    }
    let alive = true;
    let started = false;
    const load = () => {
      if (started) {
        return;
      }
      started = true;
      fetch(`${razdelBase(zadanie)}/dannye/primer/${kind}.json?v=${versiya}`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json() as Promise<string>;
        })
        .then((steps) => {
          if (alive) setRazbor(otkrytRazbor(steps, seal));
        })
        .catch(() => {
          started = false;
          if (alive) setRazbor('net');
        });
    };
    const onToggle = () => {
      if (details.open) load();
    };
    const summary = details.querySelector(':scope > summary');
    onToggle();
    summary?.addEventListener('pointerenter', load);
    summary?.addEventListener('focus', load);
    details.addEventListener('toggle', onToggle);
    return () => {
      alive = false;
      summary?.removeEventListener('pointerenter', load);
      summary?.removeEventListener('focus', load);
      details.removeEventListener('toggle', onToggle);
    };
  }, [zadanie, kind, seal, versiya]);

  if (razbor === null || razbor === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={razbor === null}>
        <p className="stk-lead">
          {razbor === null ? tekstyKarty45.primerZhdyot : tekstyKarty45.primerNet}
        </p>
      </div>
    );
  }
  const primer = primerIzRazbora(razbor, tekstyKarty45.metod, tekstyKarty45.risunok);
  return (
    <div ref={anchor}>
      <KartaPrimer
        uslovieHtml={uslovieHtml}
        {...(kartinka === undefined ? {} : { risunok: <Kartinka45 {...kartinka} /> })}
        shagi={primer.shagi}
        posle={primer.posle}
        otvet={primer.otvet}
        {...(opasnoHtml === undefined ? {} : { opasnoHtml })}
        trenirovatHref={trenirovatHref}
        opornyeHref={opornyeHref}
        labels={tekstyKarty45}
      />
    </div>
  );
}
