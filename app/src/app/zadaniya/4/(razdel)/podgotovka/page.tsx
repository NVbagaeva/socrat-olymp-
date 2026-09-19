import type { Metadata } from 'next';
import { PodgotovkaList } from '@/components/tasks/veroyatnost/PodgotovkaList';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep4Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №4: список блоков.
 *
 * Задачи 1–18 авторского конспекта, разложенные по его же трём
 * заголовкам. Блок открывается своей страницей — как у задания №12.
 */
export default function Podgotovka4Tab() {
  const bloki = prep4Pool();
  return (
    <PodgotovkaShell zadanie={4} base="/zadaniya/4" active="all" bloki={bloki}>
      <PodgotovkaList zadanie={4} bloki={bloki} listHref="/zadaniya/4/podgotovka/" />
    </PodgotovkaShell>
  );
}
