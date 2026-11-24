import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye10Spisok } from '@/components/tasks/zadanie10/Opornye10';
import { NAVYKI10, OPORNYE10 } from '@/content/prikladnye10';
import { zadanie10Title } from '@/content/zadanie10';
import { blokHref10 } from '@/lib/zadanie10/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie10/opornye';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: zadanie10Title('Опорные задачи'),
};

/**
 * Опорные задачи №10: четыре навыка, семь блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3, как у №7 и №6). На карточке блока — название, значок и
 * прогресс; формул на карточках нет (docs/razdel-pravila.md, п. 3).
 * Картинки сюжетов — внутри блока, у задач с сюжетом.
 */
export default function Opornye10Tab() {
  const navyki = NAVYKI10.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap(({ slug, znak }) => {
      const blok = BLOKI_OPORNYH.find((b) => b.slug === slug);
      return blok === undefined
        ? []
        : [
            {
              slug,
              href: blokHref10(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              zadachi: blok.zadachi.map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z10-opornye" aria-labelledby="z10-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z10-opornye-title">
          {OPORNYE10.title}
        </h2>
        <p className="stk-lead">{OPORNYE10.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye10Spisok navyki={navyki} />
    </section>
  );
}
