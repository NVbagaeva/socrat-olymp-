import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { proizvodnayaTitle } from '@/content/proizvodnaya';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №9 (заготовка: страницу заменяет рабочий экран). */
export default function Generator9Tab() {
  return <EmptyState title="Раздел собирается" description="Эта вкладка скоро заработает." />;
}
