import Link from 'next/link';
import { kartinkaMetoda } from './teoriya/metody/GlavaMetoda4';
import { GLAVA_METODA, glavaPoMetodu } from '@/content/veroyatnost4-metody-teoriya';
import { assetUrl } from '@/lib/assetUrl';
import { KLYUCHEVYE_4 } from '@/lib/veroyatnost/metody4';
import { teoriyaMetodaHref45 } from '@/lib/veroyatnost/trening/links';
import './metody-kartochki4.css';

/**
 * Карточки пяти ключевых методов задания №4. Карточка целиком — ссылка
 * на главу метода во вкладке «Теория» (адрес — teoriyaMetodaHref45,
 * якорь из lib/paths.ts); в главе — тренажёр и опорные задачи метода.
 *
 * Стеклянная картинка метода стоит в правом верхнем углу: 96 px на
 * компьютере, 64 px на телефоне. Нет файла картинки — карточка без неё.
 */
export function MetodyKartochki4() {
  return (
    <ul className="vmetody__grid m4k-grid">
      {KLYUCHEVYE_4.map((m) => {
        const glava = glavaPoMetodu(m.id);
        const kartinka = glava === undefined ? null : kartinkaMetoda(glava.kartinka);
        return (
          <li key={m.id}>
            <Link
              className={kartinka === null ? 'vmetod m4k' : 'vmetod m4k has-kartinka'}
              href={teoriyaMetodaHref45(4, m.id)}
            >
              <span className="vmetod__no m4k__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="vmetod__title m4k__title">{m.nazvanie}</span>
              {kartinka === null || glava === undefined ? null : (
                <img
                  className="m4k__kartinka"
                  src={assetUrl(kartinka.s1)}
                  srcSet={`${assetUrl(kartinka.s1)} 120w, ${assetUrl(kartinka.s2)} 240w`}
                  sizes="(max-width: 767px) 64px, 96px"
                  width={96}
                  height={96}
                  alt={glava.kartinkaAlt}
                  decoding="async"
                />
              )}
              <span className="vmetod__sut m4k__sut">{m.opisanie}</span>
              <span className="m4k__chitat">{GLAVA_METODA.chitat}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
