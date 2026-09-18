import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №4.
 *
 * Задачи берутся из авторского конспекта и разложены по его же
 * заголовкам. Ни одной задачи здесь нет до того, как автор утвердит
 * схему раздела: придумывать состав нельзя.
 */
export default function Podgotovka4Tab() {
  return (
    <EmptyState
      title="Материал готовится"
      description="Здесь появятся блоки подготовительных задач из конспекта: «Определение вероятности», «Жребий, две группы, круглый стол», «Геометрическая вероятность»."
    />
  );
}
