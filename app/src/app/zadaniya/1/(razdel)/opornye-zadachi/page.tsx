import type { Metadata } from 'next';
import { Opornye1List } from '@/components/tasks/planimetriya/Opornye1List';
import { Opornye1Shell } from '@/components/tasks/planimetriya/Opornye1Shell';
import { OPORNYE } from '@/content/opornye';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { prepPool1 } from '@/lib/planimetriya/prep/pool';

export const metadata: Metadata = {
  title: zadanie1Title(OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» №1: блоки тренировок навыков и разобранные
 * задачи по прототипам. Пул собирается на сборке: в разметку
 * тренировок уходят условия, отпечатки и закрытые разборы.
 */
export default function Opornye1Page() {
  const base = `${ZADANIYA}/${ZADANIE1.slug}`;
  return (
    <Opornye1Shell base={base} active="all">
      <Opornye1List bloki={prepPool1()} listHref={`${base}/${OPORNYE.tail}`} />
    </Opornye1Shell>
  );
}
