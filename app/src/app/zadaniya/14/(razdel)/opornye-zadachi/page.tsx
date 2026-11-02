import type { Metadata } from 'next';
import Link from 'next/link';
import { ReshenoVBloke14 } from '@/components/zadanie14/Opornye14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';
import { BLOKI_14 } from '@/lib/zadanie14/opornye';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie14Title('Опорные задачи'),
};

/**
 * Опорные задачи №14: 15 блоков навыков по 10 задач. На карточке —
 * номер, название, описание, число задач, прогресс и «Начать»; формул
 * на карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye14Tab() {
  const base = `${ZADANIYA}/${ZADANIE14.slug}`;
  return (
    <div className="z14-op-spisok flow">
      <p className="z14-op-spisok__lead">
        Каждый блок — один навык. Первая задача разобрана полностью, остальные решаешь сам: с
        подсказками-вопросами и проверкой ответа.
      </p>
      <ul className="z14-op-spisok__setka">
        {BLOKI_14.map((b) => (
          <li key={b.id} className="z14-op-karta">
            <span className="z14-op-karta__no">{b.no}</span>
            <h3 className="z14-op-karta__title">{b.nazvanie}</h3>
            <p className="z14-op-karta__opisanie">{b.opisanie}</p>
            <p className="z14-op-karta__schet">
              {b.zadachi.length} задач · <ReshenoVBloke14 ids={b.zadachi.map((z) => z.id)} />
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
