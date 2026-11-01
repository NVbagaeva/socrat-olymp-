import type { Metadata } from 'next';
import { Teoriya11 } from '@/components/tasks/zadanie11/Teoriya11';
import { ZADANIE11 } from '@/content/zadanie11';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE11.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(11, 'teoriya');

/**
 * Вкладка «Теория» задания №11: разделы подряд, содержание рядом.
 * Страница серверная: формулы и таблицы набираются KaTeX на сборке.
 */
export default function Teoriya11Tab() {
  return <Teoriya11 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE11.slug}`} />;
}
