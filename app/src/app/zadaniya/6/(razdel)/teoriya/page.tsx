import type { Metadata } from 'next';
import { Teoriya6 } from '@/components/tasks/zadanie6/Teoriya6';
import { ZADANIE6 } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE6.tabs.find((tab) => tab.id === 'teoriya')?.label ?? 'Теория';

export const metadata: Metadata = metaVkladki(6, 'teoriya');

/**
 * Вкладка «Теория» задания №6: девять разделов в рамках и карточках,
 * содержание рядом, «Проверь себя» после каждого раздела. Страница
 * серверная: формулы набираются KaTeX на сборке.
 */
export default function Teoriya6Tab() {
  return <Teoriya6 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE6.slug}`} />;
}
