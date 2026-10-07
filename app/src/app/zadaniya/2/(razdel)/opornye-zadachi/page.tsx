import type { Metadata } from 'next';
import { Opornye2List } from '@/components/tasks/vektory/Opornye2List';
import { Opornye2Shell } from '@/components/tasks/vektory/Opornye2Shell';
import { OPORNYE } from '@/content/opornye';
import { VEKTORY, vektoryMeta } from '@/content/vektory';
import { opornyePool } from '@/lib/vektory/opornye';
import { prepPool2 } from '@/lib/vektory/prep/pool';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  ...vektoryMeta(OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» №2: блоки тренировок навыков и разобранные
 * задачи по прототипам. Оба пула собираются на сборке: в разметку
 * тренировок уходят условия, отпечатки и закрытые разборы, в
 * разобранные задачи — полные решения (это образцы).
 */
export default function Opornye2Page() {
  const base = `${ZADANIYA}/${VEKTORY.slug}`;
  const listHref = `${base}/${OPORNYE.tail}`;
  return (
    <Opornye2Shell base={base} active="all">
      <Opornye2List bloki={prepPool2()} listHref={listHref} pool={opornyePool()} />
    </Opornye2Shell>
  );
}
