import type { Metadata } from 'next';
import Link from 'next/link';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { MetodKartinka } from '@/components/tasks/veroyatnost/MetodKartinka';
import { Opornye45Spisok } from '@/components/tasks/veroyatnost/opornye/Opornye45Spisok';
import { OPORNYE } from '@/content/opornye';
import { DOROZHKA_SLOVA, veroyatnostTitle } from '@/content/veroyatnost';
import { NAVYKI4, OPORNYE4_LEAD } from '@/content/veroyatnost4';
import { tekstyOpornyh45 } from '@/content/veroyatnost45';
import { prep4Pool } from '@/lib/veroyatnost/pool';
import { blokHref45, trenazherHref45 } from '@/lib/veroyatnost/trening/links';
import '@/components/tasks/veroyatnost/opornye/opornye45.css';

export const metadata: Metadata = {
  title: veroyatnostTitle('4', OPORNYE.title),
};

const T = tekstyOpornyh45(OPORNYE4_LEAD);

/**
 * «Опорные задачи» №4 на общих карточках «Стеклянной сцены»
 * (components/tasks/opornye, образец — №3, №6, №7): два навыка, три
 * блока по десять задач. На карточке блока — название, значок метода
 * (объёмная иллюстрация, как есть) и прогресс; формул на карточках нет
 * (docs/razdel-pravila.md, п. 3). Блоки и задачи не менялись.
 */
export default function Opornye4Tab() {
  const bloki = prep4Pool();
  const navyki = NAVYKI4.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap((id) => {
      const blok = bloki.find((b) => b.id === id);
      return blok === undefined
        ? []
        : [
            {
              slug: blok.id,
              href: blokHref45(4, blok.id),
              nazvanie: blok.nazvanie,
              znak: <MetodKartinka zadanie={4} metod={blok.metod ?? ''} nazvanie="" />,
              zadachi: blok.zadachi.map((z) => z.id),
            },
          ];
    }),
  }));
  return (
    <section className="prep z45-opornye" aria-labelledby="z4-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z4-opornye-title">
          {T.title}
        </h2>
        <p className="stk-lead">{T.lead}</p>
      </header>
      <TabScrollOnMount />
      <Opornye45Spisok zadanie={4} navyki={navyki} />
      <aside className="z45-op__dalshe stk-glass">
        <p>
          <b>{DOROZHKA_SLOVA.podskazka.title}</b> {DOROZHKA_SLOVA.podskazka.text}
        </p>
        <Link className="stk-btn stk-btn--tihaya" href={trenazherHref45(4)}>
          {DOROZHKA_SLOVA.podskazka.knopka}
        </Link>
      </aside>
    </section>
  );
}
