import type { Metadata } from 'next';
import { OZadanii4 } from '@/components/tasks/veroyatnost/OZadanii4';
import { tasksPage } from '@/content/tasks';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'О задании'),
};

/**
 * Вкладка «О задании» задания №4 — живёт на адресе самого раздела,
 * как первая вкладка у задания №12. Содержимое — раздел 01 референса.
 */
export default function OZadanii4Tab() {
  return <OZadanii4 base={`${tasksPage.href}/4`} />;
}
