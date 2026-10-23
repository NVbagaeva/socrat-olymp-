import Link from 'next/link';
import { EmptyState } from '@/components/ui';
import { STEREO, ZAGLUSHKA_STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { ZADANIYA } from '@/lib/paths';

/**
 * Вкладка стереометрии, которая ещё не собрана: заголовок и честное
 * пустое состояние со ссылкой на теорию. Лента при этом полная —
 * вкладки откроются по мере наполнения (docs/stereometry-plan.md, п. 8).
 */
export function ZaglushkaStereo({ no, vkladka }: { no: StereoNo; vkladka: string }) {
  const base = `${ZADANIYA}/${STEREO[no].slug}`;
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <EmptyState
        title={ZAGLUSHKA_STEREO.title}
        description={ZAGLUSHKA_STEREO.text}
        action={
          <Link className="btn btn--primary btn--sm" href={`${base}/teoriya/`}>
            {ZAGLUSHKA_STEREO.kTeorii}
          </Link>
        }
      />
    </>
  );
}
