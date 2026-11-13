import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Opornye2Spisok } from '@/components/tasks/vektory/Opornye2';
import { TriZnaka2 } from '@/components/tasks/vektory/TriZnaka2';
import { OPORNYE } from '@/content/opornye';
import { vektoryTitle } from '@/content/vektory';
import { NAVYKI2, OPORNYE2 } from '@/content/vektory2';
import { typeset } from '@/lib/tex';
import { blokHref2 } from '@/lib/vektory/links';
import { opornyePool } from '@/lib/vektory/opornye';
import { BLOKI } from '@/lib/vektory/prep/bloki';
import { mikroId } from '@/lib/vektory/progress';

export const metadata: Metadata = {
  title: vektoryTitle(OPORNYE.title),
};

/**
 * Опорные задачи №2: три навыка, пять блоков по десять задач — на
 * общих карточках «Стеклянной сцены» (components/tasks/opornye, образец
 * — №3). Разобранные задачи по каждому типу теперь — примеры типов на
 * вкладке «О задании»; здесь остаётся блок повышенной сложности
 * «косинус с тремя знаками».
 */
export default function Opornye2Tab() {
  const navyki = NAVYKI2.map((navyk) => ({
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
              href: blokHref2(slug),
              nazvanie: blok.nazvanie,
              znakHtml: typeset(`$${znak}$`),
              zadachi: blok.zadachi.map((_, i) => mikroId(blok.id, i + 1)),
            },
          ];
    }),
  }));
  const { triZnaka } = opornyePool();
  return (
    <section className="prep z2-opornye" aria-labelledby="z2-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z2-opornye-title">
          {OPORNYE2.title}
        </h2>
        <p className="stk-lead">{OPORNYE2.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye2Spisok navyki={navyki} />
      <TriZnaka2 poyasnenieHtml={triZnaka.poyasnenieHtml} zadachi={triZnaka.zadachi} />
    </section>
  );
}
