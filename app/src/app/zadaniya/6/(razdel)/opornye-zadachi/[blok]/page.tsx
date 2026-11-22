import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye6 } from '@/components/tasks/zadanie6/Opornye6';
import { Tex } from '@/components/ui/Tex';
import { OPORNYE6 } from '@/content/sluchainye6';
import { zadanie6Title } from '@/content/zadanie6';
import { OPORNYE6_HREF, tipHref6 } from '@/lib/zadanie6/links';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie6/opornye';
import { prototype } from '@/lib/zadanie6/prototypes';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie6Title('Опорные задачи'),
};

/** Блок опорных задач №6: задача за задачей на общем экране блока. */
export default async function Opornye6Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  return (
    <section className="prep z6-opornye" aria-labelledby="z6-opornye-blok-title">
      <Link className="z6-opornye__nazad" href={OPORNYE6_HREF} scroll={false}>
        {OPORNYE6.kListu}
      </Link>
      <h2 className="stk-h3" id="z6-opornye-blok-title">
        {b.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye6
        blok={b.id}
        zapomni={
          <>
            <b>{OPORNYE6.zapomni}</b> <Tex text={b.zapomni} />
          </>
        }
        zadachi={opornyeDlyaBrauzera(b)}
      />
      <section className="z6-op__gde" aria-labelledby="z6-op-gde">
        <h3 id="z6-op-gde" className="stk-h4">
          {OPORNYE6.gde}
        </h3>
        <ul className="z6-op__gde-spisok">
          {b.prototipy.map((id) => (
            <li key={id}>
              <Link href={tipHref6(id)} className="z6-gde__chip z6-gde__chip--steklo">
                <Tex text={prototype(id).title} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
