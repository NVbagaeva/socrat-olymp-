import type { Metadata } from 'next';
import { KlyuchevyeMetody } from '@/components/tasks/veroyatnost/KlyuchevyeMetody';
import { veroyatnostTitle, vkladka } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', vkladka('4', 'metody')),
};

/**
 * Вкладка «Ключевые методы решения» задания №4: пять методов списка А —
 * карта банка ФИПИ — карточками, каждая открывает модалку метода.
 * Тот же компонент, что у задания №5.
 */
export default function Metody4Tab() {
  return <KlyuchevyeMetody zadanie={4} />;
}
