import type { Metadata } from 'next';
import { Trenazher19 } from '@/components/zadanie19/Trenazher19';
import { ZADANIE19 } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'trenazher')?.label ?? '';

export const metadata: Metadata = metaVkladki(19, 'trenazher');

/** Вкладка «Тренажёр» №19: тренировка на общей сессии: выбор метода, уровня и числа заданий. */
export default function Trenazher19Tab() {
  return <Trenazher19 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE19.slug}`} />;
}
