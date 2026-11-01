import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Skhema18Stranica } from '@/components/zadanie18/Skhema18Stranica';
import { SOBRANNYE, skhema18 } from '@/content/zadanie18/spisok';
import { metaPodstranitsy } from '@/content/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

/* Статический экспорт: страницы есть только у собранных схем. */
export function generateStaticParams() {
  return SOBRANNYE.map((s) => ({ skhema: s.id }));
}
export const dynamicParams = false;

type Params = Promise<{ skhema: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = skhema18((await params).skhema);
  return s === undefined ? {} : metaPodstranitsy(18, 'skhema', tekstBezTex(s.nazvanie));
}

/** Страница ключевой схемы: живой чертёж, следствия, доказательство, «Знаю / Не знаю». */
export default async function Skhema18Page({ params }: { params: Params }) {
  const id = (await params).skhema;
  if (skhema18(id) === undefined) notFound();
  return <Skhema18Stranica id={id} />;
}
