import type { Metadata } from 'next';
import { Generator2Tab } from '@/components/tasks/vektory/Generator2Tab';
import { VEKTORY, vektoryMeta } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  ...vektoryMeta('Генератор'),
};

/** Вкладка «Генератор» задания №2: вариант для печати. */
export default function Generator2Page() {
  return <Generator2Tab base={`${ZADANIYA}/${VEKTORY.slug}`} />;
}
