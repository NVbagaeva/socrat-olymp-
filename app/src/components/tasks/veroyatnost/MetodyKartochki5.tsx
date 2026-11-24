import Link from 'next/link';
import { kartinkaUrl } from './teoriya/metody/GlavaMetoda4';
import { kartinkaMetoda5 } from './teoriya/metody/GlavaMetoda5';
import { GLAVA_METODA } from '@/content/veroyatnost4-metody-teoriya';
import { glavaPoMetodu5 } from '@/content/veroyatnost5-metody-teoriya';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { teoriyaMetodaHref45 } from '@/lib/veroyatnost/trening/links';
import './metody-kartochki4.css';

/**
 * Карточки десяти ключевых методов задания №5 — как у №4
 * (MetodyKartochki4): карточка целиком — ссылка на главу метода во
 * вкладке «Теория», стеклянная картинка в правом верхнем углу (96 px,
 * на телефоне 64 px). Формула метода, если она есть, — в плашке под
 * описанием, набрана KaTeX на сборке. Нет файла картинки — карточка без неё.
 */
export function MetodyKartochki5({ formuly }: { formuly: Readonly<Record<string, string>> }) {
  return (
    <ul className="vmetody__grid m4k-grid">
      {METODY_5.map((m) => {
        const glava = glavaPoMetodu5(m.id);
        const kartinka = glava === undefined ? null : kartinkaMetoda5(glava.kartinka);
        const formula = formuly[m.id];
        return (
          <li key={m.id}>
            <Link
              className={[
                'vmetod m4k',
                kartinka === null ? '' : 'has-kartinka',
                formula === undefined ? '' : 'has-formula',
              ]
                .filter(Boolean)
                .join(' ')}
              href={teoriyaMetodaHref45(5, m.id)}
            >
              <span className="vmetod__no m4k__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="vmetod__title m4k__title">{m.nazvanie}</span>
              {kartinka === null || glava === undefined ? null : (
                <img
                  className="m4k__kartinka"
                  src={kartinkaUrl(kartinka.s1)}
                  srcSet={`${kartinkaUrl(kartinka.s1)} 120w, ${kartinkaUrl(kartinka.s2)} 240w`}
                  sizes="(max-width: 767px) 64px, 96px"
                  width={96}
                  height={96}
                  alt={glava.kartinkaAlt}
                  decoding="async"
                />
              )}
              <span className="vmetod__sut m4k__sut">{m.opisanie}</span>
              {formula === undefined ? null : (
                <span
                  className="vmetod__formula m4k__formula"
                  dangerouslySetInnerHTML={{ __html: formula }}
                />
              )}
              <span className="m4k__chitat">{GLAVA_METODA.chitat}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
