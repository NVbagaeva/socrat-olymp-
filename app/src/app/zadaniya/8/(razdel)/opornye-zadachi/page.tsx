import type { Metadata } from 'next';
import { Podgotovka8List } from '@/components/tasks/vychisleniya/Podgotovka8List';
import { Podgotovka8Shell } from '@/components/tasks/vychisleniya/Podgotovka8Shell';
import { prepPool } from '@/lib/vychisleniya/prep/pool';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(8, 'opornye');

/** Список блоков подготовки задания №8. */
export default function Podgotovka8Page() {
  const base = `${ZADANIYA}/8`;
  return (
    <Podgotovka8Shell base={base} active="all">
      <Podgotovka8List blocks={prepPool()} listHref={`${base}/podgotovka/`} />
    </Podgotovka8Shell>
  );
}
