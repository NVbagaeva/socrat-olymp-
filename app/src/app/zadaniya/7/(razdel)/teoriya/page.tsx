import type { Metadata } from 'next';
import { Teoriya7 } from '@/components/tasks/zadanie7/Teoriya7';
import { ZADANIE7 } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE7.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(7, 'teoriya');

/**
 * Вкладка «Теория» задания №7: девять разделов в рамках и карточках,
 * содержание рядом, живой тригонометрический круг. Страница серверная:
 * формулы набираются KaTeX на сборке.
 */
export default function Teoriya7Tab() {
  return <Teoriya7 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE7.slug}`} />;
}
