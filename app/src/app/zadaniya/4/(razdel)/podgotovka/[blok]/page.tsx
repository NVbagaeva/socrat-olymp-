import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PodgotovkaBlok } from '@/components/tasks/veroyatnost/PodgotovkaBlok';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { veroyatnostTitle } from '@/content/veroyatnost';
import { prep4Pool } from '@/lib/veroyatnost/pool';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return prep4Pool().map((blok) => ({ blok: blok.id }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = prep4Pool().find((item) => item.id === blok);
  return {
    title: veroyatnostTitle('4', found === undefined ? 'Подготовительные задачи' : found.nazvanie),
  };
}

/** Блок подготовки задания №4: ряд кружков и одна задача на экране. */
export default async function Podgotovka4BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const bloki = prep4Pool();
  const found = bloki.find((item) => item.id === blok);
  if (found === undefined) {
    notFound();
  }
  return (
    <PodgotovkaShell zadanie={4} base="/zadaniya/4" active={found.id} bloki={bloki}>
      <PodgotovkaBlok zadanie={4} blok={found} listHref="/zadaniya/4/podgotovka/" />
    </PodgotovkaShell>
  );
}
