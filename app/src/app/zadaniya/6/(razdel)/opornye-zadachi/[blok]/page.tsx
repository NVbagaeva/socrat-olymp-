import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Opornye6 } from '@/components/tasks/zadanie6/Opornye6';
import { Tex } from '@/components/ui/Tex';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie6/opornye';
import { kodNaSayte, prototype } from '@/lib/zadanie6/prototypes';
import { ZADANIYA } from '@/lib/paths';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie6Title('Опорные задачи'),
};

export default async function Opornye6Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  const base = `${ZADANIYA}/${ZADANIE6.slug}`;
  return (
    <div>
      <p className="z6-razbor-str__nazad">
        <Link href={`${base}/opornye-zadachi/`}>← Все блоки</Link>
      </p>
      <h2 className="t-h3">
        {b.no}. {b.nazvanie}
      </h2>
      <Opornye6 blok={b.id} zapomni={b.zapomni} zadachi={opornyeDlyaBrauzera(b)} />
      <section className="z6-op__gde" aria-labelledby="z6-op-gde">
        <h3 id="z6-op-gde" className="t-h4">
          Где пригодится этот навык
        </h3>
        <ul className="z6-op__gde-spisok">
          {b.prototipy.map((id) => (
            <li key={id}>
              <Link href={`${base}/razbor/${id}/`} className="z6-gde__chip">
                {kodNaSayte(id)} <Tex text={prototype(id).title} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
