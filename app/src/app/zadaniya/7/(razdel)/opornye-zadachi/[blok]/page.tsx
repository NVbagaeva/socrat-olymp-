import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Opornye7 } from '@/components/tasks/zadanie7/Opornye7';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie7/opornye';
import { kodNaSayte, prototype } from '@/lib/zadanie7/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie7Title('Опорные задачи'),
};

export default async function Opornye7Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE7.slug}`;
  return (
    <div>
      <p className="z7-razbor-str__nazad">
        <Link href={`${base}/opornye-zadachi/`}>← Все блоки</Link>
      </p>
      <h2 className="t-h3">
        {b.no}. {b.nazvanie}
      </h2>
      <Opornye7 blok={b.id} zapomni={b.zapomni} zadachi={opornyeDlyaBrauzera(b)} />
      <section className="z7-op__gde" aria-labelledby="z7-op-gde">
        <h3 id="z7-op-gde" className="t-h4">
          Где пригодится этот навык
        </h3>
        <ul className="z7-op__gde-spisok">
          {b.prototipy.map((id) => (
            <li key={id}>
              <Link href={`${base}/razbor/${id}/`} className="z7-gde__chip">
                {kodNaSayte(id)} <Tex text={prototype(id).title} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
