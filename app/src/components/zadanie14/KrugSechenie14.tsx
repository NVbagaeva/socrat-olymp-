'use client';

import { useMemo, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { serii as seriiTab, ZNACHENIYA, znachenie, znachTex } from '@/lib/zadanie7/trig';
import { krugHtml } from '@/lib/zadanie14/krugHtml';
import { otvetATex, s, type Seriya } from '@/lib/zadanie14/ugol';

/**
 * Сечение окружности: $\sin x=a$ — прямая параллельно оси косинусов,
 * $\cos x=a$ — параллельно оси синусов. Кнопки — табличные значения,
 * на рисунке — точки пересечения, под ним — серии.
 */
export function KrugSechenie14({ funkciya }: { funkciya: 'sin' | 'cos' }) {
  const spisok = ZNACHENIYA[funkciya].filter((k) => k !== '0');
  const [kod, setKod] = useState<string>('1/2');
  const a = znachenie(kod);
  const serii: Seriya[] = useMemo(
    () => seriiTab(funkciya, kod).map((x) => s({ pi: x.t0 }, x.per)),
    [funkciya, kod],
  );
  const html = useMemo(() => {
    const tex = znachTex(kod);
    const tochki = serii.map((sr) => ({ ugol: sr.nach, akcent: true, luch: true }));
    return krugHtml(
      funkciya === 'sin'
        ? { sechenieSin: { a, tex }, tochki }
        : { sechenieCos: { a, tex }, tochki },
    );
  }, [funkciya, kod, a, serii]);
  const f = funkciya === 'sin' ? '\\sin x' : '\\cos x';
  return (
    <div className="z14-inter">
      <div className="z14-inter__knopki" role="group" aria-label="Значение a">
        {spisok.map((k) => (
          <button
            key={k}
            type="button"
            className="z14-inter__knopka"
            aria-pressed={k === kod}
            onClick={() => setKod(k)}
          >
            <Tex text={`$${znachTex(k)}$`} />
          </button>
        ))}
      </div>
      <p className="z14-inter__text">
        <Tex text={`$${f}=${znachTex(kod)}$`} />
      </p>
      <div className="z14-inter__krug" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="z14-inter__text" aria-live="polite">
        <Tex text={`$${otvetATex(serii)}$`} />
      </p>
    </div>
  );
}
