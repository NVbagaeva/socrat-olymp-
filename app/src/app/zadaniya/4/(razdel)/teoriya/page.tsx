import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Теория'),
};

/**
 * Вкладка «Теория» задания №4.
 *
 * Текст теории пишет автор. Пока его нет — вкладка честно об этом
 * говорит; придуманного здесь не будет.
 */
export default function Teoriya4Tab() {
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появится теория раздела. Текст напишет автор — придуманного здесь не будет."
    />
  );
}
