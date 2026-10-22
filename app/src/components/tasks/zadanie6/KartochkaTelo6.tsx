import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { BLOKI_KARTOCHKI_6, type Kartochka6 } from '@/content/teoriya6';

/**
 * Тело карточки теории №6: заголовок и цветные блоки «Определение /
 * Свойство / Формула / Важно». Без банка — его берут и вкладка
 * «Теория», и листы генератора (рамки теории), и шпаргалка.
 */
export function KartochkaTelo6({ k, children }: { k: Kartochka6; children?: ReactNode }) {
  return (
    <article className="z6-k" id={`k-${k.id}`}>
      <h4 className="z6-k__title">
        <Tex text={k.title} />
      </h4>
      <div className="z6-k__bloki">
        {k.bloki.map((b, i) => (
          <section className={`z6-blok z6-blok--${b.vid}`} key={`${k.id}-${i}`}>
            <span className="z6-blok__plashka">{BLOKI_KARTOCHKI_6[b.vid]}</span>
            {b.tekst.map((t) => (
              <p className="z6-blok__p" key={t}>
                <Tex text={t} />
              </p>
            ))}
            {b.formula ? (
              <p className="z6-blok__formula">
                <Tex text={`$\\displaystyle ${b.formula}$`} />
              </p>
            ) : null}
          </section>
        ))}
      </div>
      {children}
    </article>
  );
}
