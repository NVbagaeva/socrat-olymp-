import type { Metadata } from 'next';
import { ZaglushkaStereo } from '@/components/stereo/ZaglushkaStereo';
import { vkladkaStereo } from '@/content/stereo/zadaniya';
import { metaZaglushkiVkladki } from '@/content/seo';

const VKLADKA = vkladkaStereo('opornye');

export const metadata: Metadata = metaZaglushkiVkladki(15, 'Опорные задачи');

/** Опорные задачи №15 — этап 4 плана; пока честная заглушка. */
export default function Page() {
  return <ZaglushkaStereo no="15" vkladka={VKLADKA} />;
}
