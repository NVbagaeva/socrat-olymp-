'use client';

import { useEffect, useRef, useState } from 'react';
import { Reshenie, Uslovie } from '@/components/chast2/Chast2Card';
import { Details } from '@/components/ui';
import { ZADACHA_VARIANTA13 as T } from '@/content/ekonomicheskie13';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import type { MestoVarianta } from '@/lib/zadanie13/zadachaVarianta';

/**
 * Задача из варианта целиком: условие с чертежом, под «Решение и ответ» —
 * решение по этапам и ответ. Разметка — та же, что в разборе второй
 * части вариантов (components/chast2).
 */
export function ZadachaVarianta13Telo({ z }: { z: Chast2Zadacha }) {
  return (
    <div className="kz-primer z13-var">
      <Uslovie z={z} />
      {z.risunok === null ? null : (
        <figure className="c2-ris" dangerouslySetInnerHTML={{ __html: z.risunok }} />
      )}
      <Details title={T.reshenie} className="z13-primer z13-var__reshenie">
        <Reshenie z={z} />
      </Details>
    </div>
  );
}

/**
 * Задача из варианта, которая собирается в браузере, когда ученик
 * раскрывает карточку (<details>): шаблоны вариантов и их движки
 * грузятся отдельным куском по первому раскрытию, а не со страницей —
 * так же, как пример типа (PrimerLazy13).
 */
export function ZadachaVarianta13({ k, v }: MestoVarianta) {
  const anchor = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState<Chast2Zadacha | null | 'net'>(null);

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
      void import('@/lib/zadanie13/zadachaVarianta')
        .then((mod) => mod.zadachaVarianta17({ k, v }))
        .then(
          (ready) => {
            if (alive) setZ(ready);
          },
          () => {
            if (alive) setZ('net');
          },
        );
    };
    load();
    details.addEventListener('toggle', load);
    return () => {
      alive = false;
      details.removeEventListener('toggle', load);
    };
  }, [k, v]);

  if (z === null || z === 'net') {
    return (
      <div className="kz-primer kz-primer--zhdyot" ref={anchor} aria-busy={z === null}>
        <p className="stk-lead">{z === null ? T.zhdyot : T.net}</p>
      </div>
    );
  }
  return (
    <div ref={anchor}>
      <ZadachaVarianta13Telo z={z} />
    </div>
  );
}
