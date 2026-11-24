import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye11Spisok } from '@/components/tasks/zadanie11/Opornye11';
import { NAVYKI11, OPORNYE11 } from '@/content/tekstovye11';
import { zadanie11Title } from '@/content/zadanie11';
import { blokHref11 } from '@/lib/zadanie11/links';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: zadanie11Title(OPORNYE11.title),
};

/**
 * Опорные задачи №11: пять навыков, двенадцать блоков по десять задач —
 * на общих карточках «Стеклянной сцены» (components/tasks/opornye,
 * образец — №3, №7, №6). На карточке блока — название, значок и
 * прогресс; формул и служебных меток на карточках нет
 * (docs/razdel-pravila.md, п. 3).
 */
export default function Opornye11Tab() {
  const navyki = NAVYKI11.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap(({ slug, znak }) => {
      const blok = BLOKI.find((b) => b.slug === slug);
      return blok === undefined
        ? []
        : [
            {
              slug,
              href: blokHref11(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              /* Ключи исходов микрозадач — те же, что у прежнего экрана
                 (lib/zadanie11/progress.ts, mikroId11): «P11-03:7». */
              zadachi: blok.zadachi.map((_, i) => `${blok.id}:${i + 1}`),
            },
          ];
    }),
  }));
  return (
    <section className="prep z11-opornye" aria-labelledby="z11-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z11-opornye-title">
          {OPORNYE11.title}
        </h2>
        <p className="stk-lead">{OPORNYE11.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye11Spisok navyki={navyki} />
    </section>
  );
}
