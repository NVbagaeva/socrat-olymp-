import { TabScrollOnMount } from '../TabScroll';
import { TRENAZHER11 } from '@/content/tekstovye11';
import { texPlain } from '@/lib/tex';
import { blokHref11, teoriyaHref11 } from '@/lib/zadanie11/links';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { katalog11 } from '@/lib/zadanie11/trening/dannye-server';
import { gruppy11 } from './gruppy11';
import type { SsylkiTipa11 } from './razdel11';
import { Trenazher11 } from './Trenazher11';

/** «Материалы к задаче» по подтипам: теория (своя у подтипа или раздела) и опорный блок. */
function ssylki11(): Record<string, SsylkiTipa11> {
  const { ssylki } = dannyeTrenazhera();
  return Object.fromEntries(
    SUBTYPES.map((st) => {
      const s = ssylki[st.section];
      const yakor = s.podtipy[st.id] ?? s.teoriya;
      return [
        st.id,
        {
          ...(yakor === '' ? {} : { teoriya: teoriyaHref11(yakor) }),
          ...(s.opornyy === null ? {} : { opornye: blokHref11(s.opornyy.slug) }),
        },
      ];
    }),
  );
}

/**
 * Вкладка «Тренажёр» задания №11 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (девять групп, 68 типов), экран задачи, итоги. Сами задачи
 * на странице не лежат: тренировка собирается в браузере из каталога,
 * условия приезжают файлами подтипов (public/data/zadanie11, без ответов).
 */
export function Trenazher11Tab({ base }: { base: string }) {
  const nazvaniyaTekst = Object.fromEntries(SUBTYPES.map((st) => [st.id, texPlain(st.title)]));
  return (
    <section className="trainer z11-trening trn-host" aria-labelledby="z11-trening-title">
      <h2 className="sr-only" id="z11-trening-title">
        {TRENAZHER11.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher11
        base={base}
        gruppy={gruppy11()}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog11()}
        ssylki={ssylki11()}
      />
    </section>
  );
}
