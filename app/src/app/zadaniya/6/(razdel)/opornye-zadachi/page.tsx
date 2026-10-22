import type { Metadata } from 'next';
import Link from 'next/link';
import { ReshenoVBloke6 } from '@/components/tasks/zadanie6/Opornye6';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { BLOKI_OPORNYH } from '@/lib/zadanie6/opornye';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie6Title('Опорные задачи'),
};

/**
 * Опорные задачи №6: семь блоков навыков по 10 задач. На карточке —
 * номер, название, описание, число задач, прогресс и «Начать»; формул
 * на карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye6Tab() {
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  return (
    <div className="z6-op-spisok">
      <p className="z6-o__lead">
        Короткие задачи на один навык. Из этих навыков складывается любая задача №6.
      </p>
      <ul className="z6-op-spisok__setka">
        {BLOKI_OPORNYH.map((b) => (
          <li key={b.id} className="z6-op-karta">
            <span className="z6-op-karta__no">{b.no}</span>
            <h3 className="z6-op-karta__title">{b.nazvanie}</h3>
            <p className="z6-op-karta__opisanie">{b.opisanie}</p>
            <p className="z6-op-karta__schet">
              {b.zadachi.length} задач · <ReshenoVBloke6 ids={b.zadachi.map((z) => z.id)} />
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
