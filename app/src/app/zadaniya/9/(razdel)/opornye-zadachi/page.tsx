import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye9Spisok } from '@/components/tasks/proizvodnaya/Opornye9';
import { OPORNYE } from '@/content/opornye';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { NAVYKI9, OPORNYE9 } from '@/content/proizvodnaya9';
import { blokHref9 } from '@/lib/proizvodnaya/links';
import { PREP_BLOCKS } from '@/lib/proizvodnaya/prep/blocks';
import { typeset } from '@/lib/tex';

export const metadata: Metadata = {
  title: proizvodnayaTitle(OPORNYE.title),
};

/**
 * Опорные задачи №9: три навыка, шесть блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3). На карточке блока — название, значок и прогресс; формул на
 * карточках нет (docs/razdel-pravila.md, п. 3). Разобранные задачи по
 * типам теперь — примеры типов на вкладке «О задании».
 */
export default function Opornye9Tab() {
  const navyki = NAVYKI9.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap(({ slug, znak }) => {
      const blok = PREP_BLOCKS.find((b) => b.slug === slug);
      return blok === undefined
        ? []
        : [
            {
              slug,
              href: blokHref9(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              /* Ключ задачи — «блок:номер»: прежнее хранилище помнит номера решённых. */
              zadachi: blok.zadachi.map((_, i) => `${blok.id}:${i + 1}`),
            },
          ];
    }),
  }));
  return (
    <section className="prep z9-opornye" aria-labelledby="z9-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z9-opornye-title">
          {OPORNYE9.title}
        </h2>
        <p className="stk-lead">{OPORNYE9.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye9Spisok navyki={navyki} />
    </section>
  );
}
