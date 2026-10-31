import type { Metadata } from 'next';
import { Trenazher19 } from '@/components/zadanie19/Trenazher19';
import { ZADANIE19, zadanie19Title } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE19.tabs.find((tab) => tab.id === 'trenazher')?.label ?? '';

export const metadata: Metadata = {
  title: zadanie19Title(VKLADKA),
};

/** Вкладка «Тренажёр» №19: тренировка на общей сессии: выбор метода, уровня и числа заданий. */
export default function Trenazher19Tab() {
  return <Trenazher19 vkladka={VKLADKA} base={`${ZADANIYA}/${ZADANIE19.slug}`} />;
}
