import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye7 } from '@/components/tasks/zadanie7/Opornye7';
import { Tex } from '@/components/ui/Tex';
import { OPORNYE7 } from '@/content/uravneniya7';
import { zadanie7Title } from '@/content/zadanie7';
import { OPORNYE7_HREF, tipHref7 } from '@/lib/zadanie7/links';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie7/opornye';
import { prototype } from '@/lib/zadanie7/prototypes';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie7Title('Опорные задачи'),
};

/** Блок опорных задач №7: задача за задачей на общем экране блока. */
export default async function Opornye7Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  return (
    <section className="prep z7-opornye" aria-labelledby="z7-opornye-blok-title">
      <Link className="z7-opornye__nazad" href={OPORNYE7_HREF} scroll={false}>
        {OPORNYE7.kListu}
      </Link>
      <h2 className="stk-h3" id="z7-opornye-blok-title">
        {b.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye7
        blok={b.id}
        zapomni={
          <>
            <b>{OPORNYE7.zapomni}</b> <Tex text={b.zapomni} />
          </>
        }
        zadachi={opornyeDlyaBrauzera(b)}
      />
      <section className="z7-op__gde" aria-labelledby="z7-op-gde">
        <h3 id="z7-op-gde" className="stk-h4">
          {OPORNYE7.gde}
        </h3>
        <ul className="z7-op__gde-spisok">
          {b.prototipy.map((id) => (
            <li key={id}>
              <Link href={tipHref7(id)} className="z7-gde__chip z7-gde__chip--steklo">
                <Tex text={prototype(id).title} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
