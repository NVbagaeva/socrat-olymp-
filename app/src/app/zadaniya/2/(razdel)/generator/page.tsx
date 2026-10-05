import type { Metadata } from 'next';
import { Generator2Tab } from '@/components/tasks/vektory/Generator2Tab';
import { tasksPage } from '@/content/tasks';
import { VEKTORY, vektoryTitle } from '@/content/vektory';

export const metadata: Metadata = {
  title: vektoryTitle('Генератор'),
};

/** Вкладка «Генератор» задания №2: вариант для печати. */
export default function Generator2Page() {
  return <Generator2Tab base={`${tasksPage.href}/${VEKTORY.slug}`} />;
}
