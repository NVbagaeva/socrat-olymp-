import type { Metadata } from 'next';
import { Opornye1Spisok } from '@/components/tasks/planimetriya/Opornye1';
import { IkonkaBloka1 } from '@/components/tasks/planimetriya/IkonkaBloka1';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { NAVYKI1, OPORNYE1 } from '@/content/planimetriya1';
import { zadanie1Title } from '@/content/zadanie1';
import { prepPool1 } from '@/lib/planimetriya/prep/pool';
import { blokHref1 } from '@/lib/planimetriya/trening/links';

export const metadata: Metadata = {
  title: zadanie1Title(OPORNYE1.title),
};

/**
 * Опорные задачи №1: три навыка, девять блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3). На карточке блока — название, значок-фигура и прогресс; формул
 * на карточках нет (docs/razdel-pravila.md, п. 3). Разобранные задачи по
 * прототипам переехали в примеры типов на «О задании».
 */
export default function Opornye1Tab() {
  const pool = prepPool1();
  const navyki = NAVYKI1.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap(({ slug, ikonka }) => {
      const blok = pool.find((b) => b.slug === slug);
      return blok === undefined
        ? []
        : [
            {
              slug,
              href: blokHref1(slug),
              nazvanie: blok.nazvanie,
              znakHtml: '',
              znak: <IkonkaBloka1 blok={ikonka} />,
              /* Ключ исхода — как mikroId (lib/planimetriya/progress.ts):
                 «P1-1:3»; тот модуль клиентский. */
              zadachi: blok.zadachi.map((z) => `${blok.id}:${z.no}`),
            },
          ];
    }),
  }));
  return (
    <section className="prep z1-opornye" aria-labelledby="z1-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z1-opornye-title">
          {OPORNYE1.title}
        </h2>
        <p className="stk-lead">{OPORNYE1.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye1Spisok navyki={navyki} />
    </section>
  );
}
