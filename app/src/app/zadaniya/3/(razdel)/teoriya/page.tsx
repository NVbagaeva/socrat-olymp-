import type { Metadata } from 'next';
import { ProverkaTeorii } from '@/components/kartochki/ProverkaTeorii';
import { TeoriyaStereo } from '@/components/stereo/TeoriyaStereo';
import { kolodaNomera } from '@/content/kartochki';
import { ZADANIYA } from '@/lib/paths';
import '@/components/stereo/teoriya3-steklo.css';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';

const VKLADKA = vkladkaStereo('teoriya');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/** Вкладка «Теория» №3: главы подряд, «Содержание» рядом. Формулы набираются KaTeX на сборке. */
export default function Page() {
  return (
    <>
      <div className="z3-teo">
        <ProverkaTeorii
          task={3}
          href={`${ZADANIYA}/3/kartochki/`}
          ids={kolodaNomera(3).kartochki.map((k) => k.id)}
        />
      </div>
      <TeoriyaStereo no="3" vkladka={VKLADKA} />
    </>
  );
}
