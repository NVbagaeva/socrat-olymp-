import Link from 'next/link';
import { GLAVA_METODA } from '@/content/veroyatnost4-metody-teoriya';
import { glavaPoMetodu5 } from '@/content/veroyatnost5-metody-teoriya';
import { kartinkaMetoda } from '@/lib/veroyatnost/metody-kartinki';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { teoriyaMetodaHref45 } from '@/lib/veroyatnost/trening/links';
import { KartinkaMetodaImg } from './KartinkaMetodaImg';
import './metody-kartochki4.css';

/**
 * Карточки десяти ключевых методов задания №5 — как у №4
 * (MetodyKartochki4): карточка целиком — ссылка на главу метода во
 * вкладке «Теория»; сверху стеклянная плашка с картинкой метода, ниже
 * номер и название, описание, формула метода (если есть, набрана KaTeX
 * на сборке) и «Читать теорию →». Нет картинки — карточка без плашки.
 */
export function MetodyKartochki5({ formuly }: { formuly: Readonly<Record<string, string>> }) {
  return (
    <ul className="vmetody__grid">
      {METODY_5.map((m) => {
        const glava = glavaPoMetodu5(m.id);
        const estKartinka = kartinkaMetoda(5, m.id) !== undefined;
        const formula = formuly[m.id];
        return (
          <li key={m.id}>
            <Link
              className={estKartinka ? 'vmetod vmetod--kartinka m4k' : 'vmetod m4k'}
              href={teoriyaMetodaHref45(5, m.id)}
            >
              {estKartinka ? (
                <span className="vmetod__kartinka">
                  <KartinkaMetodaImg zadanie={5} id={m.id} alt={glava?.kartinkaAlt ?? ''} />
                </span>
              ) : null}
              <span className="vmetod__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="vmetod__title m4k__title">{m.nazvanie}</span>
              <span className="vmetod__sut m4k__sut">{m.opisanie}</span>
              {formula === undefined ? null : (
                <span className="vmetod__formula" dangerouslySetInnerHTML={{ __html: formula }} />
              )}
              <span className="m4k__chitat">{GLAVA_METODA.chitat}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
