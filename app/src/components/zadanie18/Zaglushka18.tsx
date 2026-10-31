import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { ZADANIE18, ZAGLUSHKA_18 } from '@/content/zadanie18';
import { ZADANIYA } from '@/lib/paths';

/**
 * Вкладка №18, которая ещё не собрана: заголовок вкладки и честное
 * пустое состояние со ссылкой на ключевые схемы.
 */
export function Zaglushka18({ vkladka }: { vkladka: string }) {
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <EmptyState
        title={ZAGLUSHKA_18.title}
        description={ZAGLUSHKA_18.text}
        action={
          <Link className="btn btn--primary btn--sm" href={`${ZADANIYA}/${ZADANIE18.slug}/`}>
            {ZAGLUSHKA_18.kSkhemam}
          </Link>
        }
      />
    </>
  );
}
