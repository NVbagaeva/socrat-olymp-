import type { Metadata } from 'next';
import { KlyuchevyeMetody } from '@/components/tasks/veroyatnost/KlyuchevyeMetody';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Ключевые методы решения'),
};

/**
 * Вкладка «Ключевые методы решения» задания №5: десять методов автора
 * карточками, каждая открывает модалку метода. Тот же компонент, что у
 * задания №4, — с составом методов задания №5.
 */
export default function Metody5Tab() {
  return <KlyuchevyeMetody zadanie={5} />;
}
