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
};

/** Множество якорей теории номера; undefined — номер не описан. */
export function yakorya(task) {
  return PO_NOMERAM[task]?.();
}
