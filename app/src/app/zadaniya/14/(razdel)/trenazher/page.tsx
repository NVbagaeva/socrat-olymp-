import type { Metadata } from 'next';
import { Trenazher14 } from '@/components/zadanie14/Trenazher14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie14Title('Тренажёр'),
};

/** Вкладка «Тренажёр» №14: фильтр по методам, автопроверка обоих пунктов, общая сессия. */
export default function Trenazher14Tab() {
  return <Trenazher14 base={`${ZADANIYA}/${ZADANIE14.slug}`} />;
}
