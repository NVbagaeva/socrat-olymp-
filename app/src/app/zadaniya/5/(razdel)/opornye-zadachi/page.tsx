import type { Metadata } from 'next';
import { PodgotovkaList } from '@/components/tasks/veroyatnost/PodgotovkaList';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { OPORNYE } from '@/content/opornye';
import { PODGOTOVKA_SLOVA, veroyatnostTitle } from '@/content/veroyatnost';
import { prep5Pool } from '@/lib/veroyatnost/pool';

export const metadata: Metadata = {
  title: veroyatnostTitle('5', OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» задания №5: список блоков.
 *
 * Семь блоков по методам из «Ключевых методов решения», по десять
 * задач: сорок задач авторского конспекта (19–62) и тридцать
 * дописанных (lib/veroyatnost/podgotovka5.ts). Блок открывается своей
 * страницей — как у задания №12.
 */
export default function Podgotovka5Tab() {
  const bloki = prep5Pool();
  return (
    <PodgotovkaShell
      zadanie={5}
      base="/zadaniya/5"
      lead={PODGOTOVKA_SLOVA.leadPoMetodam}
      active="all"
      bloki={bloki}
    >
      <PodgotovkaList zadanie={5} bloki={bloki} listHref="/zadaniya/5/podgotovka/" />
    </PodgotovkaShell>
  );
}
