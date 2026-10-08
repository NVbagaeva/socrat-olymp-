import type { Metadata } from 'next';
import { Trenazher2Tab } from '@/components/tasks/vektory/Trenazher2Tab';
import { TRENAZHER_2, VEKTORY, vektoryTitle } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: vektoryTitle(TRENAZHER_2.title),
};

/** Вкладка «Тренажёр» задания №2: конфигуратор, сессия собирается в браузере. */
export default function Trenazher2Page() {
  return <Trenazher2Tab base={`${ZADANIYA}/${VEKTORY.slug}/trenazher/`} />;
}
