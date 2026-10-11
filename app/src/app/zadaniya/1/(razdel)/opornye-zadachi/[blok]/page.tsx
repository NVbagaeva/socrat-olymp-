import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornye1Screen } from '@/components/tasks/planimetriya/Opornye1Screen';
import { Opornye1Shell } from '@/components/tasks/planimetriya/Opornye1Shell';
import { OPORNYE } from '@/content/opornye';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { BLOKI, blokBySlug } from '@/lib/planimetriya/prep/bloki';
import { prepPool1 } from '@/lib/planimetriya/prep/pool';

export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: zadanie1Title(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/** Блок тренировок: десять микрозадач в закрытом виде, собранных на сборке. */
export default async function Opornye1BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool1().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE1.slug}`;
  return (
    <Opornye1Shell base={base} active={found.slug}>
      <Opornye1Screen
        blockId={found.id}
        title={found.nazvanie}
        tasks={found.zadachi}
        formulyHtml={found.formulyHtml}
        listHref={`${base}/${OPORNYE.tail}`}
      />
    </Opornye1Shell>
  );
}
