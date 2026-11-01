import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { metaZaglushkiVkladki } from '@/content/seo';

export const metadata: Metadata = metaZaglushkiVkladki(8, 'Теория');

/**
 * Вкладка «Теория» задания №8.
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
