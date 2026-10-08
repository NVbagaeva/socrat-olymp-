import { EmptyState } from '@/components/ui';
import { GOTOVITSYA_14 } from '@/content/zadanie14';

/**
 * Пустая вкладка задания №14. Материалы пишет автор; пока их нет,
 * вкладка честно об этом говорит — как «Теория» у №8.
 */
export function Gotovitsya14({ tab }: { tab: keyof typeof GOTOVITSYA_14.text }) {
  return <EmptyState title={GOTOVITSYA_14.title} description={GOTOVITSYA_14.text[tab]} />;
}
