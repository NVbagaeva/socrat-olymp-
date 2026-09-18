import type { Metadata } from 'next';
import { KlyuchevyeMetody } from '@/components/tasks/veroyatnost/KlyuchevyeMetody';
import { veroyatnostTitle } from '@/content/veroyatnost';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Ключевые методы решения'),
};

/**
 * Вкладка «Ключевые методы решения» задания №4 — раздел 02 референса:
 * пять методов по одной схеме, с рисунком-компонентом у каждого.
 */
export default function Metody4Tab() {
  return <KlyuchevyeMetody />;
}
