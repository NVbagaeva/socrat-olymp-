import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaZaglushkiVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('generator');

export const metadata: Metadata = metaZaglushkiVkladki(15, 'Генератор');

/** Генератор №15 — этап 5 плана; пока честная заглушка. */
export default function Page() {
  return (
    <>
      <ZaglushkaStereo no="15" vkladka={VKLADKA} />
    </>
  );
}
