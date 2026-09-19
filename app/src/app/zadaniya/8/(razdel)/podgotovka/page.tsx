import type { Metadata } from 'next';
import { Podgotovka8List } from '@/components/tasks/vychisleniya/Podgotovka8List';
import { Podgotovka8Shell } from '@/components/tasks/vychisleniya/Podgotovka8Shell';
import { tasksPage } from '@/content/tasks';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { prepPool } from '@/lib/vychisleniya/prep/pool';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Подготовительные задачи'),
};

/** Список блоков подготовки задания №8. */
export default function Podgotovka8Page() {
  const base = `${tasksPage.href}/8`;
  return (
    <Podgotovka8Shell base={base} active="all">
      <Podgotovka8List blocks={prepPool()} listHref={`${base}/podgotovka/`} />
    </Podgotovka8Shell>
  );
}
