import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Kartinka10 } from '@/components/tasks/zadanie10/Kartinka10';
import { Opornye10 } from '@/components/tasks/zadanie10/Opornye10';
import { Tex } from '@/components/ui/Tex';
import { OPORNYE10 } from '@/content/prikladnye10';
import { zadanie10Title } from '@/content/zadanie10';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { OPORNYE10_HREF, tipHref10 } from '@/lib/zadanie10/links';
import { BLOKI_OPORNYH, blokPoSlugu, opornyeDlyaBrauzera } from '@/lib/zadanie10/opornye';
import { prototype } from '@/lib/zadanie10/prototypes';
import { sealText } from '@/lib/zadanie10/secret';

export function generateStaticParams() {
  return BLOKI_OPORNYH.map((b) => ({ blok: b.slug }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: zadanie10Title('Опорные задачи'),
};

/**
 * Блок опорных задач №10: задача за задачей на общем экране блока. У
 * задачи с сюжетом под условием — картинка сюжета (как есть) и ссылка
 * на тип, где встречается эта формула. Разбор уходит в браузер закрытым
 * ключом задачи и открывается после ответа — как у №7 и №6.
 */
export default async function Opornye10Blok({ params }: { params: Promise<{ blok: string }> }) {
  const { blok } = await params;
  const b = blokPoSlugu(blok);
  if (b === undefined) {
    notFound();
  }
  const kartinki = kartinkiPrototipov();
  const zadachi = opornyeDlyaBrauzera(b);
  const risunki: Record<string, ReactNode> = {};
  for (const z of zadachi) {
    const ill = z.syuzhet === undefined ? undefined : kartinki[z.syuzhet];
    if (z.syuzhet !== undefined && ill !== undefined) {
      risunki[z.id] = (
        <figure className="z10-op__syuzhet">
          <Kartinka10 ill={ill} />
          <figcaption>
            {OPORNYE10.gdeVstrechaetsya}{' '}
            <Link href={tipHref10(z.syuzhet)}>{prototype(z.syuzhet).title}</Link>
          </figcaption>
        </figure>
      );
    }
  }
  return (
    <section className="prep z10-opornye" aria-labelledby="z10-opornye-blok-title">
      <Link className="z10-opornye__nazad" href={OPORNYE10_HREF} scroll={false}>
        {OPORNYE10.kListu}
      </Link>
      <h2 className="stk-h3" id="z10-opornye-blok-title">
        {b.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye10
        blok={b.id}
        zapomni={
          <>
            <b>{OPORNYE10.zapomni}</b> <Tex text={b.zapomni} />
          </>
        }
        zadachi={zadachi.map((z) => ({
          id: z.id,
          uslovie: z.uslovie,
          podskazka: z.podskazka,
          razbor: sealText(JSON.stringify(z.razbor), z.id),
          seal: z.seal,
        }))}
        risunki={risunki}
      />
      <section className="z10-op__gde" aria-labelledby="z10-op-gde">
        <h3 id="z10-op-gde" className="stk-h4">
          {OPORNYE10.gde}
        </h3>
        <ul className="z10-op__gde-spisok">
          {b.prototipy.map((id) => {
            const ill = kartinki[id];
            return (
              <li key={id}>
                <Link href={tipHref10(id)} className="z10-op__gde-karta">
                  {ill === undefined ? null : <Kartinka10 ill={ill} alt="" />}
                  <span>{prototype(id).title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}
