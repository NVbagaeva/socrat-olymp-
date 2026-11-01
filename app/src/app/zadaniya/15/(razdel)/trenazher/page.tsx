import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaZaglushkiVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('trenazher');

export const metadata: Metadata = metaZaglushkiVkladki(15, 'Тренажёр');

/** Тренажёр №15 — после банка №15 (этап 5б плана); пока честная заглушка. */
export default function Page() {
  return (
    <>
      <ZaglushkaStereo no="15" vkladka={VKLADKA} />
    </>
  );
}
