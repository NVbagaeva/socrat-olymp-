import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye6Spisok } from '@/components/tasks/zadanie6/Opornye6';
import { NAVYKI6, OPORNYE6 } from '@/content/sluchainye6';
import { zadanie6Title } from '@/content/zadanie6';
import { blokHref6 } from '@/lib/zadanie6/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie6/opornye';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: zadanie6Title('Опорные задачи'),
};

/**
 * Опорные задачи №6: три навыка, семь блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3). На карточке блока — название, значок и прогресс; формул на
 * карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye6Tab() {
  const navyki = NAVYKI6.map((navyk) => ({
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
              href: blokHref6(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              zadachi: blok.zadachi.map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z6-opornye" aria-labelledby="z6-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z6-opornye-title">
          {OPORNYE6.title}
        </h2>
        <p className="stk-lead">{OPORNYE6.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye6Spisok navyki={navyki} />
    </section>
  );
}
