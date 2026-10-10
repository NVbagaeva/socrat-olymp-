import type { Metadata } from 'next';
import { Generator9Tab } from '@/components/tasks/proizvodnaya/Generator9Tab';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №9: вариант для печати. */
export default function Generator9Page() {
  return <Generator9Tab base={`${ZADANIYA}/9`} />;
}
