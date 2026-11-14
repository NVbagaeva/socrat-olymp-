import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye11 } from '@/components/tasks/zadanie11/Opornye11';
import { OPORNYE11 } from '@/content/tekstovye11';
import { O_ZADANII_11, zadanie11Title } from '@/content/zadanie11';
import { OPORNYE11_HREF, gruppaHref11 } from '@/lib/zadanie11/links';
import { BLOKI, blokBySlug } from '@/lib/zadanie11/prep/bloki';
import { prepPool11 } from '@/lib/zadanie11/prep/pool';
import { SECTIONS } from '@/lib/zadanie11/taxonomy';

/* Статический экспорт: адреса блоков известны до сборки. */
export function generateStaticParams() {
  return BLOKI.map((b) => ({ blok: b.slug }));
}
export const dynamicParams = false;

type Params = Promise<{ blok: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { blok } = await params;
  const found = blokBySlug(blok);
  return { title: zadanie11Title(found === undefined ? OPORNYE11.title : found.nazvanie) };
}

/**
 * Блок «Опорных задач» №11: десять микрозадач в закрытом виде на общем
 * экране блока. Пул собран на сборке — в разметку уходят условия,
 * таблицы с «?», отпечатки, закрытые подсказки и разборы. Внизу —
 * разделы задачи, где пригодится навык (свой раздел блока и те, перед
 * которыми он нужен: O_ZADANII_11.pered).
 */
export default async function Opornye11BlokPage({ params }: { params: Params }) {
  const { blok } = await params;
  const found = prepPool11().find((item) => item.slug === blok);
  if (found === undefined) {
    notFound();
  }
  const gde = SECTIONS.filter(
    (s) => s.id === found.razdel || (O_ZADANII_11.pered[s.id] ?? []).includes(found.nazvanie),
  );
  return (
    <section className="prep z11-opornye" aria-labelledby="z11-opornye-blok-title">
      <Link className="z11-opornye__nazad" href={OPORNYE11_HREF} scroll={false}>
        {OPORNYE11.kListu}
      </Link>
      <h2 className="stk-h3" id="z11-opornye-blok-title">
        {found.nazvanie}
      </h2>
      <TabScrollOnMount />
      <Opornye11
        blokId={found.id}
        zapomni={
          <>
            <b>{OPORNYE11.zapomni}</b>{' '}
            {found.zapomniHtml.map((html, i) => (
              <span key={i} dangerouslySetInnerHTML={{ __html: `${html} ` }} />
            ))}
          </>
        }
        zadachi={found.zadachi}
      />
      {gde.length === 0 ? null : (
        <section className="z11-op__gde" aria-labelledby="z11-op-gde">
          <h3 id="z11-op-gde" className="stk-h4">
            {OPORNYE11.gde}
          </h3>
          <ul className="z11-op__gde-spisok">
            {gde.map((s) => (
              <li key={s.id}>
                <Link href={gruppaHref11(s.id)} className="z11-materialy__ssylka">
                  {s.nazvanie}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
