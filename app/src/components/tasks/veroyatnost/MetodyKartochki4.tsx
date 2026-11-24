import Link from 'next/link';
import { GLAVA_METODA, glavaPoMetodu } from '@/content/veroyatnost4-metody-teoriya';
import { kartinkaMetoda } from '@/lib/veroyatnost/metody-kartinki';
import { KLYUCHEVYE_4 } from '@/lib/veroyatnost/metody4';
import { teoriyaMetodaHref45 } from '@/lib/veroyatnost/trening/links';
import { KartinkaMetodaImg } from './KartinkaMetodaImg';
import './metody-kartochki4.css';

/**
 * Карточки пяти ключевых методов задания №4. Карточка целиком — ссылка
 * на главу метода во вкладке «Теория» (адрес — teoriyaMetodaHref45,
 * якорь из lib/paths.ts); в главе — тренажёр и опорные задачи метода.
 *
 * Раскладка — как у карточек №5: сверху стеклянная плашка с картинкой
 * во всю ширину (общие .vmetod--kartinka и .vmetod__kartinka из
 * app/zadaniya/veroyatnost.css), ниже номер и название, описание и
 * «Читать теорию →» внизу. Нет картинки метода — карточка без плашки.
 */
export function MetodyKartochki4() {
  return (
    <ul className="vmetody__grid">
      {KLYUCHEVYE_4.map((m) => {
        const glava = glavaPoMetodu(m.id);
        const estKartinka = kartinkaMetoda(4, m.id) !== undefined;
        return (
          <li key={m.id}>
            <Link
              className={estKartinka ? 'vmetod vmetod--kartinka m4k' : 'vmetod m4k'}
              href={teoriyaMetodaHref45(4, m.id)}
            >
              {estKartinka ? (
                <span className="vmetod__kartinka">
                  <KartinkaMetodaImg zadanie={4} id={m.id} alt={glava?.kartinkaAlt ?? ''} />
                </span>
              ) : null}
              <span className="vmetod__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="vmetod__title m4k__title">{m.nazvanie}</span>
              <span className="vmetod__sut m4k__sut">{m.opisanie}</span>
              <span className="m4k__chitat">{GLAVA_METODA.chitat}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
