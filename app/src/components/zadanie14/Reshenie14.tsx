'use client';

import { useMemo } from 'react';
import { Tex } from '@/components/ui/Tex';
import { krugiHtml, krugiOtbora, krugSerii, krugHtml } from '@/lib/zadanie14/krugHtml';
import { otvetA, otvetB, otvetRazminki, razborB } from '@/lib/zadanie14/tekst';
import type { Zadacha14 } from '@/lib/zadanie14/tipy';

/**
 * Полное решение задачи №14: пункт а по шагам, окружность с точками
 * серий и ответ; пункт б — разбор отбора (по окружности или двойным
 * неравенством) с окружностью (длинный промежуток — две) и ответ.
 */
export function Reshenie14({ z }: { z: Zadacha14 }) {
  const krugA = useMemo(() => (z.vid === 'uravnenie' ? krugHtml(krugSerii(z.serii)) : ''), [z]);
  const krugB = useMemo(
    () =>
      z.vid === 'uravnenie' && z.promezhutok !== undefined
        ? krugiHtml(krugiOtbora(z.serii, z.promezhutok))
        : '',
    [z],
  );
  if (z.vid === 'razminka') {
    return (
      <div className="z14-reshenie flow">
        <ol className="z14-shagi">
          {z.reshenie.map((s, i) => (
            <li key={i}>
              <Tex text={s} />
            </li>
          ))}
        </ol>
        <p className="z14-otvet">
          <b>Ответ: </b>
          <Tex text={otvetRazminki(z)} />
        </p>
      </div>
    );
  }
  const b = otvetB(z);
  return (
    <div className="z14-reshenie flow">
      {b === null ? null : <h5 className="z14-reshenie__punkt">Пункт а</h5>}
      <ol className="z14-shagi">
        {z.reshenie.map((s, i) => (
          <li key={i}>
            <Tex text={s} />
          </li>
        ))}
      </ol>
      <div className="z14-krugi" dangerouslySetInnerHTML={{ __html: krugA }} />
      <p className="z14-otvet">
        <b>{b === null ? 'Ответ: ' : 'Ответ а: '}</b>
        <Tex text={otvetA(z)} />
      </p>
      {b === null ? null : (
        <>
          <h5 className="z14-reshenie__punkt">
            Пункт б — {z.otbor === 'nerav' ? 'двойным неравенством' : 'по окружности'}
          </h5>
          <ol className="z14-shagi">
            {razborB(z).map((s, i) => (
              <li key={i}>
                <Tex text={s} />
              </li>
            ))}
          </ol>
          <div className="z14-krugi" dangerouslySetInnerHTML={{ __html: krugB }} />
          <p className="z14-otvet">
            <b>Ответ б: </b>
            <Tex text={b} />
          </p>
        </>
      )}
    </div>
  );
}
