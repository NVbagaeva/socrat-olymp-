import { Tex } from '@/components/ui/Tex';
import { BLOKI_KARTOCHKI_7, type Kartochka7 } from '@/content/teoriya7';

/**
 * Тело карточки теории №7: заголовок и цветные блоки «Определение /
 * Свойство / Теорема / Важно». Без банка задач — его берут и вкладка
 * «Теория» (с примером и «Где на ЕГЭ»), и печатный лист генератора
 * (рамки теории), и шпаргалка.
 */
export function KartochkaTelo7({ k, children }: { k: Kartochka7; children?: React.ReactNode }) {
  return (
    <article className="z7-k" id={`k-${k.id}`}>
      <h4 className="z7-k__title">
        <Tex text={k.title} />
      </h4>
      <div className="z7-k__bloki">
        {k.bloki.map((b, i) => (
          <section className={`z7-blok z7-blok--${b.vid}`} key={`${k.id}-${i}`}>
            <span className="z7-blok__plashka">{BLOKI_KARTOCHKI_7[b.vid]}</span>
            {b.tekst.map((t) => (
              <p className="z7-blok__p" key={t}>
                <Tex text={t} />
              </p>
            ))}
            {b.formula ? (
              <p className="z7-blok__formula">
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
