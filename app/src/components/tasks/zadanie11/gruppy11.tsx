import type { GruppaVybora } from '../trening';
import { GRUPPY11_TON } from '@/content/tekstovye11';
import { typeset } from '@/lib/tex';
import { SECTIONS } from '@/lib/zadanie11/taxonomy';
import { SUBTYPES } from '@/lib/zadanie11/prototypes';
import { Piktogramma, ZNACHOK_RAZDELA } from './Piktogrammy';

/**
 * Группы №11 для выбора тем, прогресса и итогов: девять разделов
 * задачи (от разминки до прогрессий), в каждом — подтипы. Значок
 * группы — пиктограмма раздела, названия типов набраны KaTeX на сборке.
 * Кодов подтипов («ДП-07») в названиях нет.
 */
export function gruppy11(): GruppaVybora[] {
  return SECTIONS.map((s) => ({
    id: s.id,
    nazvanie: s.nazvanie,
    znakHtml: '',
    znak: <Piktogramma name={ZNACHOK_RAZDELA[s.id]} />,
    ton: GRUPPY11_TON[s.id],
    tipy: SUBTYPES.filter((st) => st.section === s.id).map((st) => ({
      id: st.id,
      nazvanieHtml: `<span>${typeset(st.title)}</span>`,
    })),
  }));
}
