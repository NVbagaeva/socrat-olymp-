import type { Metadata } from 'next';
import { PodgotovkaList } from '@/components/tasks/veroyatnost/PodgotovkaList';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', 'Подготовительные задачи'),
};

/**
 * Вкладка «Подготовительные задачи» задания №5: список блоков.
 *
 * Задачи 19–62 авторского конспекта, разложенные по его же шести
 * заголовкам. Номеров 51–54 в конспекте нет, поэтому задач сорок. Блок открывается своей страницей — как у задания №12.
 */
export default function Podgotovka5Tab() {
  const bloki = prep5Pool();
  return (
    <PodgotovkaShell zadanie={5} base="/zadaniya/5" active="all" bloki={bloki}>
      <PodgotovkaList zadanie={5} bloki={bloki} listHref="/zadaniya/5/podgotovka/" />
    </PodgotovkaShell>
  );
}
