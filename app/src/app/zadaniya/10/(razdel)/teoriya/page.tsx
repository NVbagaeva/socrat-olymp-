import type { Metadata } from 'next';
import { Teoriya10 } from '@/components/tasks/zadanie10/Teoriya10';
import { ZADANIE10 } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE10.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(10, 'teoriya');

/**
 * Вкладка «Теория» задания №10: девять разделов в рамках, содержание
 * рядом. Страница серверная: формулы набираются KaTeX на сборке.
 */
export default function Teoriya10Tab() {
  return <Teoriya10 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE10.slug}`} />;
}
