import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye13Spisok } from '@/components/tasks/zadanie13/Opornye13';
import { NAVYKI13, OPORNYE13 } from '@/content/ekonomicheskie13';
import { OPORNYE_13, zadanie13Title } from '@/content/zadanie13';
import { blokHref13 } from '@/lib/zadanie13/links';
import { BLOKI_13, zadachiBloka } from '@/lib/zadanie13/opornye/bloki';

export const metadata: Metadata = {
  title: zadanie13Title(OPORNYE13.title),
};

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Опорные задачи №13: 17 блоков по десять задач в шести группах — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец —
 * №3). На карточке блока — номер, название и прогресс; формул на
 * карточках нет (docs/razdel-pravila.md, п. 3). Задачи запечатываются на
 * странице блока.
 */
export default function Opornye13Tab() {
  const navyki = OPORNYE_13.gruppy.map((g, gi) => ({
    id: NAVYKI13[gi]?.id ?? String(gi),
    nazvanie: g.title,
    lead: '',
    ton: NAVYKI13[gi]?.ton ?? 'blue',
    bloki: g.bloki.flatMap((no) => {
      const b = BLOKI_13.find((x) => x.no === no);
      return b === undefined
        ? []
        : [
            {
              slug: b.slug,
              href: blokHref13(b.slug),
              nazvanie: b.nazvanie,
              znakHtml: esc(b.no),
              /* Ключ задачи блока — постоянный id (opornye/sostav.ts); прежние
                 записи «блок:номер» переводит opornye13Spisok. */
              zadachi: zadachiBloka(b).map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z13-opornye" aria-labelledby="z13-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z13-opornye-title">
          {OPORNYE13.title}
        </h2>
        <p className="stk-lead">{OPORNYE13.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye13Spisok navyki={navyki} />
    </section>
  );
}
