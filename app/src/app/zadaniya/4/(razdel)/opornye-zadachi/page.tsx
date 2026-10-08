import type { Metadata } from 'next';
import { OpornyeDorozhka } from '@/components/tasks/veroyatnost/OpornyeDorozhka';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { OPORNYE } from '@/content/opornye';
import { DOROZHKA_SLOVA, veroyatnostTitle } from '@/content/veroyatnost';
import { prep4Pool } from '@/lib/veroyatnost/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» задания №4: дорожка блоков по макету.
 *
 * Три блока авторского конспекта, по десять задач: задачи 1–18
 * конспекта и варианты тех же прототипов на других числах. Блоки идут
 * шагами один за другим; блок открывается своей страницей.
 */
export default function Podgotovka4Tab() {
  const bloki = prep4Pool();
  const base = `${ZADANIYA}/4`;
  return (
    <PodgotovkaShell
      zadanie={4}
      base={base}
      active="all"
      bloki={bloki}
      lead={DOROZHKA_SLOVA.lead}
      chips={false}
      className="prep--dorozhka"
    >
      <OpornyeDorozhka
        zadanie={4}
        bloki={bloki}
        listHref={`${base}/${OPORNYE.tail}`}
        trenazherHref={`${base}/trenazher/`}
      />
    </PodgotovkaShell>
  );
}
