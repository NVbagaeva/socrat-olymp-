import type { Metadata } from 'next';
import { Opornye9List } from '@/components/tasks/proizvodnaya/Opornye9List';
import { Opornye9Shell } from '@/components/tasks/proizvodnaya/Opornye9Shell';
import { OPORNYE } from '@/content/opornye';
import { PROIZVODNAYA } from '@/content/proizvodnaya';
import { prepPool9 } from '@/lib/proizvodnaya/prep/pool';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(9, 'opornye');

/**
 * Вкладка «Опорные задачи» №9: карточки шести блоков и разобранные
 * задачи по типам. Пул собирается на сборке: в разметку уходят
 * условия, отпечатки и закрытые разборы.
 */
export default function Opornye9Page() {
  const base = `${ZADANIYA}/${PROIZVODNAYA.slug}`;
  return (
    <Opornye9Shell base={base} active="all">
      <Opornye9List blocks={prepPool9()} listHref={`${base}/${OPORNYE.tail}`} />
    </Opornye9Shell>
  );
}
