import type { Metadata } from 'next';
import { KlyuchevyeMetody } from '@/components/tasks/veroyatnost/KlyuchevyeMetody';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(4, 'metody');

/**
 * Вкладка «Ключевые методы решения» задания №4: пять методов списка А —
 * карта банка ФИПИ — карточками, каждая открывает модалку метода.
 * Тот же компонент, что у задания №5.
 */
export default function Metody4Tab() {
  return <KlyuchevyeMetody zadanie={4} />;
}
