import type { Metadata } from 'next';
import { Teoriya19 } from '@/components/zadanie19/Teoriya19';
import { ZADANIE19 } from '@/content/zadanie19';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(19, 'teoriya');

/**
 * Вкладка «Теория» задания №19: главы подряд, содержание рядом.
 * Страница серверная: формулы и рисунки набираются на сборке.
 */
export default function Teoriya19Tab() {
  return <Teoriya19 vkladka={VKLADKA} />;
}
