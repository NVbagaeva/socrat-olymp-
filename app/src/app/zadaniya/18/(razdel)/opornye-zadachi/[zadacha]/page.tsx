import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Opornaya18Stranica } from '@/components/zadanie18/Opornaya18Stranica';
import { OPORNYE_18, opornaya18 } from '@/content/zadanie18/opornye';
import { metaPodstranitsy } from '@/content/seo';
import { tekstBezTex } from '@/lib/tekstFormul';

/* Статический экспорт: страницы — только у задач из списка. */
export function generateStaticParams() {
  return OPORNYE_18.map((z) => ({ zadacha: z.id }));
}
export const dynamicParams = false;

type Params = Promise<{ zadacha: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const z = opornaya18((await params).zadacha);
  return z === undefined ? {} : metaPodstranitsy(18, 'opornaya', tekstBezTex(z.nazvanie));
}

/** Страница опорной задачи: чертёж, условие, подсказка-схемы, решения по шагам, ответ. */
export default async function Opornaya18Page({ params }: { params: Params }) {
  const id = (await params).zadacha;
  if (opornaya18(id) === undefined) notFound();
  return <Opornaya18Stranica id={id} />;
}
