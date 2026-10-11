import type { Metadata } from 'next';
import Link from 'next/link';
import { ReshenoVBloke } from '@/components/tasks/zadanie10/Opornye10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { BLOKI_OPORNYH } from '@/lib/zadanie10/opornye';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie10Title('Опорные задачи'),
};

/**
 * Опорные задачи №10: семь блоков навыков по 10 задач. На карточке —
 * номер, название, описание, число задач, прогресс и «Начать»; формул
 * на карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye10Tab() {
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  const kartinki = kartinkiPrototipov();
  return (
    <div className="z10-op-spisok">
      <p className="z10-o__lead">
        Короткие задачи на один навык. Из этих навыков складывается любая прикладная задача.
      </p>
      <ul className="z10-op-spisok__setka">
        {BLOKI_OPORNYH.map((b) => (
          <li key={b.id} className="z10-op-karta">
            {(() => {
              /* Картинка — сюжета, где навык нужен; без формул (правило карточек). */
              const k = b.prototipy.map((id) => kartinki[id]).find(Boolean);
              return k ? (
                <picture className="z10-ill z10-op-karta__ill">
                  <source type="image/webp" srcSet={k.webp} />
                  <img
                    src={k.png}
                    alt=""
                    width={k.width}
                    height={k.height}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              ) : null;
            })()}
            <span className="z10-op-karta__no">{b.no}</span>
            <h3 className="z10-op-karta__title">{b.nazvanie}</h3>
            <p className="z10-op-karta__opisanie">{b.opisanie}</p>
            <ReshenoVBloke ids={b.zadachi.map((z) => z.id)} />
            <Link className="btn btn--primary" href={`${base}/opornye-zadachi/${b.slug}/`}>
              Начать
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
