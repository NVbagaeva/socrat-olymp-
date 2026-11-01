import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PodgotovkaBlok } from '@/components/tasks/veroyatnost/PodgotovkaBlok';
import { PodgotovkaShell } from '@/components/tasks/veroyatnost/PodgotovkaShell';
import { PODGOTOVKA_SLOVA } from '@/content/veroyatnost';
import { prep5Pool } from '@/lib/veroyatnost/pool';
import { metaPodstranitsy, metaVkladki } from '@/content/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return prep5Pool().map((blok) => ({ blok: blok.id }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = prep5Pool().find((item) => item.id === blok);
  return found === undefined
    ? metaVkladki(5, 'opornye')
    : metaPodstranitsy(5, 'opornaya', tekstBezTex(found.nazvanie));
}

/** Блок подготовки задания №5: ряд кружков и одна задача на экране. */
export default async function Podgotovka5BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const bloki = prep5Pool();
  const found = bloki.find((item) => item.id === blok);
  if (found === undefined) {
    notFound();
  }
  return (
    <PodgotovkaShell
      zadanie={5}
      base="/zadaniya/5"
      lead={PODGOTOVKA_SLOVA.leadPoMetodam}
      active={found.id}
      bloki={bloki}
    >
      <PodgotovkaBlok zadanie={5} blok={found} listHref="/zadaniya/5/podgotovka/" />
    </PodgotovkaShell>
  );
}
