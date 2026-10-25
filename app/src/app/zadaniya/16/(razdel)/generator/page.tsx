import type { Metadata } from 'next';
import { Zaglushka16 } from '@/components/zadanie16/Zaglushka16';
import { ZADANIE16, zadanie16Title } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE16.tabs.find((tab) => tab.id === 'generator')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie16Title(VKLADKA),
};

/** Вкладка задания №16 ещё не собрана: заглушка со ссылкой на теорию. */
export default function Zadanie16Tab() {
  return <Zaglushka16 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE16.slug}`} />;
}
