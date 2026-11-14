import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VDzKnopka } from '@/components/dz/razdel/DzVRazdele';
import { Opornye1 } from '@/components/tasks/planimetriya/Opornye1';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { OPORNYE1 } from '@/content/planimetriya1';
import { zadanie1Title } from '@/content/zadanie1';
import { typeset } from '@/lib/tex';
import { BLOKI, blokBySlug } from '@/lib/planimetriya/prep/bloki';
import { prepPool1 } from '@/lib/planimetriya/prep/pool';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import { OPORNYE1_HREF, tipHref1 } from '@/lib/planimetriya/trening/links';
import { opornyyDlya } from '@/lib/planimetriya/trenazher/dannye';
import { klyuchProto } from '@/lib/planimetriya/trenazher/sessiya';

export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: zadanie1Title(found === undefined ? OPORNYE1.title : found.nazvanie) };
}

/** Блок опорных задач №1: десять задач на общем экране блока, собраны на сборке. */
export default async function Opornye1BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool1().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  /* «Где пригодится»: типы, которым этот блок — опорный. */
  const tipy = PROTOTIPY.filter((p) => opornyyDlya(p.id, p.blok) === found.slug);
  return (
    <section className="prep z1-opornye" aria-labelledby="z1-opornye-blok-title">
      <Link className="z1-opornye__nazad" href={OPORNYE1_HREF} scroll={false}>
        {OPORNYE1.kListu}
      </Link>
      <h2 className="stk-h3" id="z1-opornye-blok-title">
        {found.nazvanie}
      </h2>
      {/* Репетитору: весь блок — в черновик ДЗ (при выдаче — аналоги). */}
      <VDzKnopka
        punkt={{ ist: 'opornye', no: 1, blok: found.slug, zadachi: null, kazhdomu: false }}
        chto={`блок «${found.nazvanie}»`}
      />
      <TabScrollOnMount />
      <Opornye1
        blok={found.id}
        zapomni={
          <>
            <b>{OPORNYE1.zapomni}</b>
            <ul className="z1-zapomni">
              {found.formulyHtml.map((html, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </ul>
          </>
        }
        zadachi={found.zadachi}
      />
      {tipy.length === 0 ? null : (
        <section className="z1-op__gde" aria-labelledby="z1-op-gde">
          <h3 id="z1-op-gde" className="stk-h4">
            {OPORNYE1.gde}
          </h3>
          <ul className="z1-op__gde-spisok">
            {tipy.map((p) => (
              <li key={p.id}>
                <Link
                  href={tipHref1(klyuchProto(p.id))}
                  className="z1-gde__chip"
                  dangerouslySetInnerHTML={{ __html: typeset(p.nazvanie) }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
