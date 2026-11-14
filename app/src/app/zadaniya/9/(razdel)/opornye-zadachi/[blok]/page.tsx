import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye9 } from '@/components/tasks/proizvodnaya/Opornye9';
import { OPORNYE } from '@/content/opornye';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { OPORNYE9, TIPY_BLOKA9 } from '@/content/proizvodnaya9';
import { OPORNYE9_HREF, tipHref9 } from '@/lib/proizvodnaya/links';
import { PREP_BLOCKS } from '@/lib/proizvodnaya/prep/blocks';
import { prepPool9 } from '@/lib/proizvodnaya/prep/pool';
import { prototypeById } from '@/lib/proizvodnaya/prototypes';
import { typeset } from '@/lib/tex';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return PREP_BLOCKS.map((block) => ({ blok: block.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const block = PREP_BLOCKS.find((item) => item.slug === blok);
  return { title: proizvodnayaTitle(block === undefined ? OPORNYE.title : block.nazvanie) };
}

/**
 * Блок опорных задач №9: десять микрозадач в закрытом виде на общем
 * экране блока. Пул собран на сборке — в разметку уходят условия,
 * чертежи условия, отпечатки и закрытые разборы.
 */
export default async function Opornye9BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool9().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  return (
    <section className="prep z9-opornye" aria-labelledby="z9-opornye-blok-title">
      <Link className="z9-opornye__nazad" href={OPORNYE9_HREF} scroll={false}>
        {OPORNYE9.kListu}
      </Link>
      <h2 className="stk-h3" id="z9-opornye-blok-title">
        {found.nazvanie}
      </h2>
      <TabScrollOnMount />
      <ErrorBoundary what="задачи">
        <Opornye9
          blokId={found.id}
          zapomni={
            <>
              <b>{OPORNYE9.zapomni}</b>
              <ul className="z9-zapomni">
                {found.zapomniHtml.map((html, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
              </ul>
            </>
          }
          zadachi={found.zadachi}
        />
      </ErrorBoundary>
      <section className="z9-op__gde" aria-labelledby="z9-op-gde">
        <h3 id="z9-op-gde" className="stk-h4">
          {OPORNYE9.gde}
        </h3>
        <ul className="z9-op__gde-spisok">
          {(TIPY_BLOKA9[found.slug] ?? []).map((id) => (
            <li key={id}>
              <Link
                href={tipHref9(id)}
                className="z9-gde__chip"
                dangerouslySetInnerHTML={{ __html: typeset(prototypeById(id)?.nazvanie ?? '') }}
              />
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
