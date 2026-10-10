import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { proizvodnayaTitle } from '@/content/proizvodnaya';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Опорные задачи'),
};

/** Вкладка «Опорные задачи» задания №9 (заготовка: страницу заменяет рабочий экран). */
export default function Opornye9Tab() {
  return <EmptyState title="Раздел собирается" description="Эта вкладка скоро заработает." />;
}
