'use client';

import { TRENAZHER_11 } from '@/content/zadanie11';
import { openText } from '@/lib/zadanie11/secret';
import type { Razbor11, Zadacha11 } from '@/lib/zadanie11/trenazher/zadacha';
import { praviloOdinRaz } from './praviloProporcii';
import { Tablitsa11 } from './Tablitsa11';

/** Закрытый блок задачи (подсказки, разбор) — по отпечатку ответа. */
export function otkryt<T>(z: Zadacha11, blob: string): T | null {
  try {
    return JSON.parse(openText(blob, z.seal)) as T;
  } catch {
    return null;
  }
}

/** Решение задачи по этапам: на экране задачи и в разборе на итогах. */
export function Razbor11Blok({ razbor }: { razbor: Razbor11 }) {
  return (
    <section
      className="z11-card z11-resh__razbor"
      aria-label={TRENAZHER_11.reshenie}
      ref={praviloOdinRaz}
    >
      <h3 className="z11-resh__h">{TRENAZHER_11.reshenie}</h3>
      {razbor.tables.map((t, i) => (
        <Tablitsa11 key={i} table={t} />
      ))}
      {razbor.etapy.map((e, i) => (
        <div key={i} className="z11-resh__etap">
          <p className="z11-resh__etap-title" dangerouslySetInnerHTML={{ __html: e.title }} />
          {e.stroki.map((line, j) => (
            <div key={j} className="z11-resh__line" dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </div>
      ))}
    </section>
  );
}
