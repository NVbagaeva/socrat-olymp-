import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Тренажёр'),
};

/**
 * Вкладка «Тренажёр» задания №5.
 *
 * Банк прототипов собирается из задачника Е. А. Ширяевой. Пока схема
 * не утверждена, здесь нет ни одного сгенерированного варианта.
 */
export default function Trenazher5Tab() {
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появится тренажёр с фильтрами по способам решения: сложение, условная вероятность, произведение, «хотя бы один раз», полная вероятность, испытания Бернулли."
    />
  );
}
