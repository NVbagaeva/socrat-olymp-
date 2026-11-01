import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { TeoriyaStereo } from '@/components/stereo/TeoriyaStereo';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIYA } from '@/lib/paths';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('teoriya');

export const metadata: Metadata = metaVkladki(3, 'teoriya');

/** Вкладка «Теория» №3: главы подряд, «Содержание» рядом. Формулы набираются KaTeX на сборке. */
export default function Page() {
  return (
    <>
      <ProverkaTeorii
        task={3}
        href={`${ZADANIYA}/3/kartochki/`}
        ids={kolodaNomera(3).kartochki.map((k) => k.id)}
      />
      <TeoriyaStereo no="3" vkladka={VKLADKA} />
    </>
  );
}
