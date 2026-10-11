import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye9Screen } from '@/components/tasks/proizvodnaya/Opornye9Screen';
import { Opornye9Shell } from '@/components/tasks/proizvodnaya/Opornye9Shell';
import { OPORNYE } from '@/content/opornye';
import { PROIZVODNAYA, proizvodnayaTitle } from '@/content/proizvodnaya';
import { PREP_BLOCKS } from '@/lib/proizvodnaya/prep/blocks';
import { prepPool9 } from '@/lib/proizvodnaya/prep/pool';
import { ZADANIYA } from '@/lib/paths';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return PREP_BLOCKS.map((block) => ({ blok: block.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const block = PREP_BLOCKS.find((item) => item.slug === blok);
  return { title: proizvodnayaTitle(block === undefined ? OPORNYE.title : block.nazvanie) };
}

/** Блок опорных задач: десять микрозадач в закрытом виде. */
export default async function Opornye9BlockPage({ params }: { params: Params }) {
  const { blok } = await params;
  const block = prepPool9().find((item) => item.slug === blok);
  if (block === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${PROIZVODNAYA.slug}`;
  return (
    <Opornye9Shell base={base} active={block.slug}>
      <ErrorBoundary what="задачи">
        <Opornye9Screen
          blockId={block.id}
          title={block.nazvanie}
          tasks={block.zadachi}
          zapomniHtml={block.zapomniHtml}
          listHref={`${base}/${OPORNYE.tail}`}
        />
      </ErrorBoundary>
    </Opornye9Shell>
  );
}
