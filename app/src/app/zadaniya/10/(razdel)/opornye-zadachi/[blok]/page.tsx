import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Opornye10 } from '@/components/tasks/zadanie10/Opornye10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie10/opornye';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie10Title('Опорные задачи'),
};

export default async function Opornye10Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE10.slug}`;
  return (
    <div>
      <p className="z10-razbor-str__nazad">
        <Link href={`${base}/opornye-zadachi/`}>← Все блоки</Link>
      </p>
      <h2 className="t-h3">
        {b.no}. {b.nazvanie}
      </h2>
      <Opornye10 zapomni={b.zapomni} zadachi={opornyeDlyaBrauzera(b)} />
    </div>
  );
}
