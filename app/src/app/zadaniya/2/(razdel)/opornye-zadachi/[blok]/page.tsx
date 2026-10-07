import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye2Screen } from '@/components/tasks/vektory/Opornye2Screen';
import { Opornye2Shell } from '@/components/tasks/vektory/Opornye2Shell';
import { OPORNYE } from '@/content/opornye';
import { VEKTORY, vektoryTitle } from '@/content/vektory';
import { BLOKI, blokBySlug } from '@/lib/vektory/prep/bloki';
import { prepPool2 } from '@/lib/vektory/prep/pool';
import { ZADANIYA } from '@/lib/paths';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: vektoryTitle(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/**
 * Блок тренировок: шесть микрозадач в закрытом виде. Пул собран на
 * сборке — в разметку уходят условия, рисунки без катетов, отпечатки
 * и закрытые разборы.
 */
export default async function Opornye2BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool2().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${VEKTORY.slug}`;
  return (
    <Opornye2Shell base={base} active={found.slug}>
      <Opornye2Screen
        blockId={found.id}
        title={found.nazvanie}
        tasks={found.zadachi}
        formulyHtml={found.formulyHtml}
        listHref={`${base}/${OPORNYE.tail}`}
      />
    </Opornye2Shell>
  );
}
