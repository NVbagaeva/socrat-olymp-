import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { vychisleniyaTitle } from '@/content/vychisleniya';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Теория'),
};

/**
 * Вкладка «Теория» задания №8 живёт на адресе раздела.
 * Текст теории пишет автор; пока его нет, вкладка честно об этом говорит.
 */
export default function Teoriya8Tab() {
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появится теория раздела. Текст напишет автор — придуманного здесь не будет."
    />
  );
}
