import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye21Spisok } from '@/components/tasks/zadanie21/Opornye21';
import { NAVYKI21, OPORNYE21 } from '@/content/naibolshee21';
import { zadanie21Title } from '@/content/zadanie21';
import { blokHref21 } from '@/lib/zadanie21/links';
import { BLOKI_OPORNYH21 } from '@/lib/zadanie21/opornye';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: zadanie21Title(OPORNYE21.title),
};

/** Опорные задачи: три навыка, семь блоков по десять задач — на общих карточках. */
export default function Opornye21Tab() {
  const navyki = NAVYKI21.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap(({ slug, znak }) => {
      const blok = BLOKI_OPORNYH21.find((b) => b.slug === slug);
      return blok === undefined
        ? []
        : [
            {
              slug,
              href: blokHref21(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              zadachi: blok.zadachi.map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z21-opornye" aria-labelledby="z21-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z21-opornye-title">
          {OPORNYE21.title}
        </h2>
        <p className="stk-lead">{OPORNYE21.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye21Spisok navyki={navyki} />
    </section>
  );
}
