import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye13Screen } from '@/components/tasks/zadanie13/Opornye13Screen';
import { Opornye13Shell } from '@/components/tasks/zadanie13/Opornye13Shell';
import { OPORNYE } from '@/content/opornye';
import { ZADANIE13, zadanie13Title } from '@/content/zadanie13';
import { BLOKI_13, blokBySlug13, zadachiBloka } from '@/lib/zadanie13/opornye/bloki';
import { prepPool13 } from '@/lib/zadanie13/opornye/pool';
import { ZADANIYA } from '@/lib/paths';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI_13.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug13(blok);
  return { title: zadanie13Title(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/**
 * Блок «Опорных задач» №13: десять задач в закрытом виде. Пул собран
 * на сборке — в разметку уходят условия, отпечатки ответов, закрытые
 * подсказки и решения.
 */
export default async function Opornye13BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool13().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const listHref = `${ZADANIYA}/${ZADANIE13.slug}/${OPORNYE.tail}`;
  return (
    <Opornye13Shell
      listHref={listHref}
      totals={BLOKI_13.map((b) => ({ id: b.id, total: zadachiBloka(b).length }))}
      vBloke
    >
      <Opornye13Screen
        blockId={found.id}
        no={found.no}
        title={found.nazvanie}
        vid={found.vid}
        tasks={found.zadachi}
        zapomniHtml={found.zapomniHtml}
        listHref={listHref}
      />
    </Opornye13Shell>
  );
}
