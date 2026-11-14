import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye21 } from '@/components/tasks/zadanie21/Opornye21';
import { Tex } from '@/components/ui/Tex';
import { OPORNYE21 } from '@/content/naibolshee21';
import { zadanie21Title } from '@/content/zadanie21';
import { OPORNYE21_HREF, tipHref21 } from '@/lib/zadanie21/links';
import { BLOKI_OPORNYH21, blokPoSlugu21, opornyeDlyaBrauzera21 } from '@/lib/zadanie21/opornye';
import { prototype } from '@/lib/zadanie21/prototypes';

export function generateStaticParams() {
  return BLOKI_OPORNYH21.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie21Title(OPORNYE21.title),
};

/** Блок опорных задач: задача за задачей на общем экране блока. */
export default async function Opornye21Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu21(blok);
  if (b === undefined) {
    notFound();
  }
  return (
    <section className="prep z21-opornye" aria-labelledby="z21-opornye-blok-title">
      <Link className="z21-opornye__nazad" href={OPORNYE21_HREF} scroll={false}>
        {OPORNYE21.kListu}
      </Link>
      <h2 className="stk-h3" id="z21-opornye-blok-title">
        {b.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye21
        blok={b.slug}
        zapomni={
          <>
            <b>{OPORNYE21.zapomni}</b> <Tex text={b.zapomni} />
          </>
        }
        zadachi={opornyeDlyaBrauzera21(b)}
      />
      <section className="z21-op__gde" aria-labelledby="z21-op-gde">
        <h3 id="z21-op-gde" className="stk-h4">
          {OPORNYE21.gde}
        </h3>
        <ul className="z21-op__gde-spisok">
          {b.prototipy.map((id) => (
            <li key={id}>
              <Link href={tipHref21(id)} className="z21-gde__chip">
                <Tex text={prototype(id).title} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
