import type { Metadata } from 'next';
import Link from 'next/link';
import { ReshenoVBloke7 } from '@/components/tasks/zadanie7/Opornye7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { BLOKI_OPORNYH } from '@/lib/zadanie7/opornye';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie7Title('Опорные задачи'),
};

/**
 * Опорные задачи №7: восемь блоков навыков по 10 задач. На карточке —
 * номер, название, описание, число задач, прогресс и «Начать»; формул
 * на карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye7Tab() {
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  return (
    <div className="z7-op-spisok">
      <p className="z7-o__lead">
        Короткие задачи на один навык. Из этих навыков складывается любое уравнение №7.
      </p>
      <ul className="z7-op-spisok__setka">
        {BLOKI_OPORNYH.map((b) => (
          <li key={b.id} className="z7-op-karta">
            <span className="z7-op-karta__no">{b.no}</span>
            <h3 className="z7-op-karta__title">{b.nazvanie}</h3>
            <p className="z7-op-karta__opisanie">{b.opisanie}</p>
            <p className="z7-op-karta__schet">
              {b.zadachi.length} задач · <ReshenoVBloke7 ids={b.zadachi.map((z) => z.id)} />
            </p>
            <Link className="btn btn--primary" href={`${base}/opornye-zadachi/${b.slug}/`}>
              Начать
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
