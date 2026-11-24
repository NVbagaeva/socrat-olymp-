import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye2 } from '@/components/tasks/vektory/Opornye2';
import { OPORNYE } from '@/content/opornye';
import { vektoryTitle } from '@/content/vektory';
import { OPORNYE2 } from '@/content/vektory2';
import { typeset } from '@/lib/tex';
import { OPORNYE2_HREF, tipHref2, tipyBloka2 } from '@/lib/vektory/links';
import { BLOKI, blokBySlug } from '@/lib/vektory/prep/bloki';
import { prepPool2 } from '@/lib/vektory/prep/pool';
import { prototypeById } from '@/lib/vektory/prototypes';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: vektoryTitle(found === undefined ? OPORNYE.title : found.nazvanie) };
}

/**
 * Блок опорных задач №2: десять микрозадач в закрытом виде на общем
 * экране блока. Пул собран на сборке — в разметку уходят условия,
 * рисунки без катетов, отпечатки и закрытые разборы.
 */
export default async function Opornye2BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool2().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  return (
    <section className="prep z2-opornye" aria-labelledby="z2-opornye-blok-title">
      <Link className="z2-opornye__nazad" href={OPORNYE2_HREF} scroll={false}>
        {OPORNYE2.kListu}
      </Link>
      <h2 className="stk-h3" id="z2-opornye-blok-title">
        {found.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye2
        blokId={found.id}
        zapomni={
          <>
            <b>{OPORNYE2.zapomni}</b>
            <ul className="z2-zapomni">
              {found.formulyHtml.map((html, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </ul>
          </>
        }
        zadachi={found.zadachi}
      />
      <section className="z2-op__gde" aria-labelledby="z2-op-gde">
        <h3 id="z2-op-gde" className="stk-h4">
          {OPORNYE2.gde}
        </h3>
        <ul className="z2-op__gde-spisok">
          {tipyBloka2(found.slug).map((id) => (
            <li key={id}>
              <Link
                href={tipHref2(id)}
                className="z2-gde__chip"
                dangerouslySetInnerHTML={{ __html: typeset(prototypeById(id)?.nazvanie ?? id) }}
              />
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
