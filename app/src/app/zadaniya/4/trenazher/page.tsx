import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №4.
 *
 * Банк прототипов собирается из задачника Е. А. Ширяевой. Пока схема
 * не утверждена, здесь нет ни одного сгенерированного варианта.
 */
export default function Trenazher4Tab() {
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появится тренажёр с фильтрами по блокам задачника: классическое и статистическое определение вероятности."
    />
  );
}
