import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { ZAGLUSHKA_19 } from '@/content/zadanie19';

/** Вкладка «Генератор» №19 ещё не собрана: честное пустое состояние со ссылкой на тренажёр. */
export function Zaglushka19({ vkladka, base }: { vkladka: string; base: string }) {
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <EmptyState
        title={ZAGLUSHKA_19.title}
        description={ZAGLUSHKA_19.text}
        action={
          <Link className="btn btn--primary btn--sm" href={`${base}/trenazher/`}>
            {ZAGLUSHKA_19.kTrenazher}
          </Link>
        }
      />
    </>
  );
}
