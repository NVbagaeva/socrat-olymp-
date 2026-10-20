import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { ZAGLUSHKA_16 } from '@/content/zadanie16';

/**
 * Вкладка №16, которая ещё не собрана: заголовок вкладки и честное
 * пустое состояние со ссылкой на теорию. Лента вкладок при этом
 * полная, как на макете, — вкладки откроются по мере наполнения.
 */
export function Zaglushka16({ vkladka, base }: { vkladka: string; base: string }) {
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <EmptyState
        title={ZAGLUSHKA_16.title}
        description={ZAGLUSHKA_16.text}
        action={
          <Link className="btn btn--primary btn--sm" href={`${base}/teoriya/`}>
            {ZAGLUSHKA_16.kTeorii}
          </Link>
        }
      />
    </>
  );
}
