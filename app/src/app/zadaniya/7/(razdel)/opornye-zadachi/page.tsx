import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye7Spisok } from '@/components/tasks/zadanie7/Opornye7';
import { NAVYKI7, OPORNYE7 } from '@/content/uravneniya7';
import { zadanie7Title } from '@/content/zadanie7';
import { blokHref7 } from '@/lib/zadanie7/links';
import { BLOKI_OPORNYH } from '@/lib/zadanie7/opornye';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: zadanie7Title('Опорные задачи'),
};

/**
 * Опорные задачи №7: четыре навыка, восемь блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3). На карточке блока — название, значок и прогресс; формул на
 * карточках нет (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye7Tab() {
  const navyki = NAVYKI7.map((navyk) => ({
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
              href: blokHref7(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              zadachi: blok.zadachi.map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z7-opornye" aria-labelledby="z7-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z7-opornye-title">
          {OPORNYE7.title}
        </h2>
        <p className="stk-lead">{OPORNYE7.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye7Spisok navyki={navyki} />
    </section>
  );
}
