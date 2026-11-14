import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VDzKnopka } from '@/components/dz/razdel/DzVRazdele';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye13Screen } from '@/components/tasks/zadanie13/Opornye13Screen';
import { Tex } from '@/components/ui/Tex';
import { OPORNYE13 } from '@/content/ekonomicheskie13';
import { zadanie13Title } from '@/content/zadanie13';
import { OPORNYE13_HREF, RAZDEL13 } from '@/lib/zadanie13/links';
import { BLOKI_13, blokBySlug13 } from '@/lib/zadanie13/opornye/bloki';
import { prepPool13 } from '@/lib/zadanie13/opornye/pool';
import { PROTOTYPE_BY_ID } from '@/lib/zadanie13/proto';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI_13.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug13(blok);
  return { title: zadanie13Title(found === undefined ? OPORNYE13.title : found.nazvanie) };
}

/**
 * Блок «Опорных задач» №13: десять задач в закрытом виде на общем экране
 * блока. Пул собран на сборке — в разметку уходят условия, отпечатки
 * ответов, закрытые подсказки и решения. Внизу — «Где пригодится этот
 * навык»: типы задач на вкладке «О задании».
 */
export default async function Opornye13BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool13().find((item) => item.slug === blok);
  const b = blokBySlug13(blok);
  if (found === undefined || b === undefined) {
    notFound();
  }
  /* «Таблица руками» (P-…) и «Определи тип» на карте задания своего типа не имеют. */
  const tipy = b.vid === 'tip' ? [] : b.prototipy.filter((id) => !id.startsWith('P-'));
  return (
    <section className="prep z13-opornye" aria-labelledby="z13-opornye-blok-title">
      <Link className="z13-opornye__nazad" href={OPORNYE13_HREF} scroll={false}>
        {OPORNYE13.kListu}
      </Link>
      <h2 className="stk-h3" id="z13-opornye-blok-title">
        {found.nazvanie}
      </h2>
      {/* Репетитору: весь блок — в черновик ДЗ (при выдаче — аналоги). */}
      <VDzKnopka
        punkt={{ ist: 'opornye', no: 13, blok: found.slug, zadachi: null, kazhdomu: false }}
        chto={`блок «${found.nazvanie}»`}
      />
      <TabScrollOnMount />
      <Opornye13Screen
        blockId={found.id}
        vid={found.vid}
        tasks={found.zadachi}
        zapomni={
          <>
            <b>{OPORNYE13.zapomni}</b>
            <ul className="z13-zapomni">
              {found.zapomniHtml.map((html, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </ul>
          </>
        }
      />
      {tipy.length === 0 ? null : (
        <section className="z13-op__gde" aria-labelledby="z13-op-gde">
          <h3 id="z13-op-gde" className="stk-h4">
            {OPORNYE13.gde}
          </h3>
          <ul className="z13-op__gde-spisok">
            {tipy.map((id) => (
              <li key={id}>
                <Link href={`${RAZDEL13}#tip-${id}`} className="z13-gde__chip">
                  <Tex text={PROTOTYPE_BY_ID[id]?.title ?? id} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
