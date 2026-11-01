import type { Metadata } from 'next';
import { Zaglushka19 } from '@/components/zadanie19/Zaglushka19';
import { ZADANIE19 } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';
import { metaZaglushkiVkladki } from '@/content/seo';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'generator')?.label ?? '';

export const metadata: Metadata = metaZaglushkiVkladki(19, 'Генератор');

/** Генератор №19 появится, когда банк наполнится всеми методами. */
export default function Generator19Tab() {
  return (
    <>
      <Zaglushka19 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE19.slug}`} />
    </>
  );
}
