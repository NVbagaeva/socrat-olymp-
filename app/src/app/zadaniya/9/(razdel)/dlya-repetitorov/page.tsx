import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { proizvodnayaTitle } from '@/content/proizvodnaya';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Для репетиторов'),
};

/** Вкладка «Для репетиторов» задания №9 (заготовка: страницу заменяет рабочий экран). */
export default function Repetitory9Tab() {
  return <EmptyState title="Раздел собирается" description="Эта вкладка скоро заработает." />;
}
