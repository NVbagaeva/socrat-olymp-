/* Якоря вкладки «Теория» по номерам: туда ведёт «Повторить теорию».
   Собираются из тех же данных, из которых строится вкладка, — якорь
   в карточке не может разойтись со страницей. Новый номер добавляет
   сюда свою функцию; без неё якоря его колоды не проверяются. */

import { requireSrc } from '../lib/load-ts.mjs';

const PO_NOMERAM = {
  /* Справочник №1: карточка темы — #k-<id>, прежние якоря — zamenyaet. */
  1: () => {
    const { RAZDELY_SPRAVOCHNIKA_1 } = requireSrc('content/spravochnik1/index');
    const out = new Set();
    for (const r of RAZDELY_SPRAVOCHNIKA_1) {
      for (const t of r.temy) {
        out.add(`k-${t.id}`);
        (t.zamenyaet ?? []).forEach((id) => out.add(`k-${id}`));
      }
    }
    return out;
  },
  /* Теория №2: раздел — #teoriya-<id>, карточка — #t2-<раздел>-<карточка>. */
  2: () => {
    const { RAZDELY_TEORII } = requireSrc('content/theoryVektory');
    const { yakorKartochki2 } = requireSrc('components/tasks/vektory/Teoriya2');
    const out = new Set();
    for (const r of RAZDELY_TEORII) {
      out.add(`teoriya-${r.id}`);
      r.section.cards.forEach((c) => out.add(yakorKartochki2(r.id, c.id)));
    }
    return out;
  },
  /* Теория №3: глава — #teoriya-<id>, раздел главы — #<id раздела> («g3-kub»). */
  3: () => {
    const { GLAVY_3 } = requireSrc('content/stereo/glavy');
    const { GLAVY_DANNYE_3 } = requireSrc('lib/stereo/glavy/index');
    const { RAZDELY_GLAVY_2 } = requireSrc('components/stereo/glavy/Glava2Treugolnik');
    const out = new Set();
    GLAVY_3.forEach((g) => out.add(`teoriya-${g.id}`));
    Object.values(GLAVY_DANNYE_3).forEach((dannye) =>
      dannye().razdely.forEach((r) => out.add(r.id)),
    );
    RAZDELY_GLAVY_2.forEach((r) => out.add(r.id));
    return out;
  },
};

/** Множество якорей теории номера; undefined — номер не описан. */
export function yakorya(task) {
  return PO_NOMERAM[task]?.();
}
