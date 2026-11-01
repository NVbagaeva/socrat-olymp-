import type { Metadata } from 'next';
import { Teoriya13 } from '@/components/tasks/zadanie13/Teoriya13';
import { ZADANIE13 } from '@/content/zadanie13';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE13.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(13, 'teoriya');

/**
 * Вкладка «Теория» задания №13: девять глав подряд, содержание рядом.
 * Страница серверная: формулы и разборы задач набираются на сборке.
 */
export default function Teoriya13Tab() {
  return <Teoriya13 vkladka={VKLADKA} />;
}
