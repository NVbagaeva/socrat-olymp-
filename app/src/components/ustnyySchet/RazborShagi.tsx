'use client';

import { useState } from 'react';
import type { ShagHtml } from '@/lib/ustnyySchet/vyvod';
import { USTNYY } from '@/content/ustnyySchet';

const T = USTNYY.stranica;

export interface RazborShagiProps {
  shagi: readonly ShagHtml[];
  /** Сразу все шаги (разбор ошибки), без кнопок. */
  vse?: boolean;
}

/** Шаги разбора: по одному кнопкой «Дальше» или все сразу. */
export function RazborShagi({ shagi, vse = false }: RazborShagiProps) {
  const [n, setN] = useState(vse ? shagi.length : 1);
  const vidno = vse ? shagi.length : n;
  return (
    <div className="us-razbor">
      <ol className="us-razbor__shagi">
        {shagi.slice(0, vidno).map((s, i) => (
          <li key={i} className="us-razbor__shag">
            {s.tekst !== null && (
              <p className="us-razbor__tekst" dangerouslySetInnerHTML={{ __html: s.tekst }} />
            )}
            <p className="us-razbor__cep" dangerouslySetInnerHTML={{ __html: s.cep }} />
          </li>
        ))}
      </ol>
      {!vse && shagi.length > 1 && (
        <div className="us-razbor__knopki">
          {vidno < shagi.length ? (
            <>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setN(n + 1)}
              >
                {T.dalshe}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setN(shagi.length)}
              >
                {T.pokazatVse}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setN(1)}>
              {T.snova}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
