import type { Metadata } from 'next';
import { Generator8Tab } from '@/components/tasks/vychisleniya/Generator8Tab';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №8: вариант для печати. */
export default function Generator8Page() {
  return <Generator8Tab base={`${ZADANIYA}/8`} />;
}
