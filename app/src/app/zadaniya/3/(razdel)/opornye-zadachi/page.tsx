import type { Metadata } from 'next';
import { TabScrollOnMount } from '@/components/tasks/TabScroll';
import { Navyki3 } from '@/components/tasks/zadanie3/Navyki3';
import { figurkaSvg } from '@/components/tasks/zadanie3/Figurka';
import { stereoTitle, vkladkaStereo } from '@/content/stereo/zadaniya';
import { BLOKI3_NAZVANIYA, NAVYKI3, OPORNYE3 } from '@/content/zadanie3/navyki';
import { BLOKI_3, zadachiBloka } from '@/lib/stereo/opornye3/bloki';
import { piktogrammaBloka } from '@/lib/stereo/opornye3/piktogrammy';
import { renderSolid } from '@/lib/solid/render';
import { OPORNYE3_HREF } from '@/lib/zadanie3/links';
import '../../../[task]/[type]/prep.css';
import '@/components/tasks/steklo/steklo.css';
import '@/components/tasks/zadanie3/zadanie3.css';

const VKLADKA = vkladkaStereo('opornye');

export const metadata: Metadata = {
  title: stereoTitle('3', VKLADKA),
};

/**
 * Вкладка «Опорные задачи» №3: семь навыков, двенадцать блоков по
 * десять задач. На карточках блоков формул нет — название, значок и
 * прогресс ученика.
 */
export default function Page() {
  const navyki = NAVYKI3.map((navyk) => ({
    id: navyk.id,
    nazvanie: navyk.nazvanie,
    lead: navyk.lead,
    ton: navyk.ton,
    bloki: navyk.bloki.flatMap((slug) => {
      const blok = BLOKI_3.find((b) => b.slug === slug && b.gotov);
      if (blok === undefined) {
        return [];
      }
      const model = piktogrammaBloka(blok.id);
      return [
        {
          slug,
          nazvanie: BLOKI3_NAZVANIYA[slug] ?? blok.nazvanie,
          zadachi: zadachiBloka(blok.id).map((z) => z.id),
          /* Значок — пиктограмма блока; у блока без неё — фигура банка. */
          znak:
            model === null
              ? figurkaSvg('P03-46')
              : renderSolid(model, { tema: 'ekran', bezPodpisey: true }),
        },
      ];
    }),
  }));
  return (
    <section className="prep z3-opornye" aria-labelledby="z3-opornye-title">
      <header className="kz-razdel__head">
        <h2 className="stk-h3" id="z3-opornye-title">
          {OPORNYE3.title}
        </h2>
        <p className="stk-lead">{OPORNYE3.lead}</p>
      </header>
      <TabScrollOnMount />
      <Navyki3 navyki={navyki} listHref={OPORNYE3_HREF} />
    </section>
  );
}
