import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tex } from '@/components/ui/Tex';
import { Opornye14 } from '@/components/zadanie14/Opornye14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';
import { BLOKI_14 } from '@/lib/zadanie14/opornye';
import { ZADANIYA } from '@/lib/paths';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOKI_14.map((b) => ({ blok: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ blok: string }>;
}): Promise<Metadata> {
  const { blok } = await params;
  const b = BLOKI_14.find((x) => x.slug === blok);
  return { title: zadanie14Title(b ? b.nazvanie.replace(/\$/g, '') : 'Опорные задачи') };
}

/** Блок опорных задач №14: «Запомни», разбор первой задачи и девять задач с подсказками. */
export default async function Blok14Page({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = BLOKI_14.find((x) => x.slug === blok);
  if (b === undefined) notFound();
  return (
    <div className="z14-op-blok flow">
      <Link className="z14-nazad" href={`${ZADANIYA}/${ZADANIE14.slug}/opornye-zadachi/`}>
        ← Все блоки
      </Link>
      <h2 className="t-h2">
        {b.no}. <Tex text={b.nazvanie} />
      </h2>
      <Opornye14 slug={b.slug} />
    </div>
  );
}
