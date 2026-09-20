import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Podgotovka8Screen } from '@/components/tasks/vychisleniya/Podgotovka8Screen';
import { Podgotovka8Shell } from '@/components/tasks/vychisleniya/Podgotovka8Shell';
import { tasksPage } from '@/content/tasks';
import { OPORNYE } from '@/content/opornye';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { PREP_BLOCKS } from '@/lib/vychisleniya/prep/blocks';
import { prepPool } from '@/lib/vychisleniya/prep/pool';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return PREP_BLOCKS.map((block) => ({ blok: block.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const block = PREP_BLOCKS.find((item) => item.slug === blok);
  return { title: vychisleniyaTitle(block === undefined ? OPORNYE.title : block.nazvanie) };
}

/**
 * Блок подготовки: восемь микро-задач в закрытом виде. Пул собран на
 * сборке — в разметку уходят условия, отпечатки и закрытые разборы.
 */
export default async function Podgotovka8BlockPage({ params }: { params: Params }) {
  const { blok } = await params;
  const block = prepPool().find((item) => item.slug === blok);
  if (block === undefined) {
    notFound();
  }
  const base = `${tasksPage.href}/8`;
  return (
    <Podgotovka8Shell base={base} active={block.slug}>
      <Podgotovka8Screen
        blockId={block.id}
        title={block.nazvanie}
        tasks={block.zadachi}
        formulyHtml={block.formulyHtml}
        listHref={`${base}/podgotovka/`}
      />
    </Podgotovka8Shell>
  );
}
