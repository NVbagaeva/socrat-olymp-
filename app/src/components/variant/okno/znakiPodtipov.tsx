import type { ReactNode } from 'react';
import { gruppy1 } from '@/components/tasks/planimetriya/Trenazher1Tab';
import { gruppy9 } from '@/components/tasks/proizvodnaya/Trenazher9Tab';
import type { Ton } from '@/components/tasks/steklo';
import type { GruppaVybora } from '@/components/tasks/trening';
import { gruppy45 } from '@/components/tasks/veroyatnost/trening/Trenazher45Tab';
import { gruppy2 } from '@/components/tasks/vektory/Trenazher2Tab';
import { gruppy8 } from '@/components/tasks/vychisleniya/Trenazher8Tab';
import { gruppy10 } from '@/components/tasks/zadanie10/Trenazher10Tab';
import { gruppy11 } from '@/components/tasks/zadanie11/gruppy11';
import { gruppy12 } from '@/components/tasks/zadanie12/Trenazher12Tab';
import { gruppy13 } from '@/components/tasks/zadanie13/Trenazher13Tab';
import { gruppy21 } from '@/components/tasks/zadanie21/Trenazher21Tab';
import { gruppy3 } from '@/components/tasks/zadanie3/Trenazher3Tab';
import { gruppy6 } from '@/components/tasks/zadanie6/Trenazher6Tab';
import { gruppy7 } from '@/components/tasks/zadanie7/Trenazher7Tab';
import { katalog12 } from '@/lib/ves12/trening/katalog';
import { SECTIONS } from '@/lib/variant/sections';

/**
 * Стеклянные миниатюры подтипов «Собрать вариант» — те же значки, что у
 * групп тренажёра раздела (Znak из «Стеклянной сцены»): формула или
 * фигура в стеклянном квадрате, тон группы. Собираются на сервере
 * (KaTeX, рисунки) и приходят в окно подтипов готовыми.
 *
 * Ключ — `${номер хранения}:${код подтипа}`. Подтип без группы
 * тренажёра в карту не попадает: окно рисует для него прежнюю
 * линейную пиктограмму.
 */
export interface ZnakPodtipa {
  html: string;
  figura?: ReactNode;
  ton: Ton;
}

const GRUPPY: Record<number, () => GruppaVybora[]> = {
  1: gruppy1,
  2: gruppy2,
  3: gruppy3,
  4: () => gruppy45(4),
  5: () => gruppy45(5),
  6: gruppy6,
  7: gruppy7,
  8: gruppy8,
  9: gruppy9,
  10: gruppy10,
  11: gruppy11,
  12: () => gruppy12(katalog12()),
  13: gruppy13,
  21: gruppy21,
};

/**
 * Подтип варианта → группа тренажёра, где коды расходятся. №21 — те же
 * группы под номерами; №8 и №3 в тренажёре делятся иначе, поэтому
 * подтип берёт значок ближайшей группы.
 */
const SOOTVETSTVIE: Record<string, string> = {
  '21:G1': '1',
  '21:G2': '2',
  '21:G3': '3',
  '21:G4': '4',
  '21:G5': '5',
  '21:G6': '6',
  '21:G7': '7',
  '8:I': 'stepeni',
  '8:II': 'logarifmy',
  '8:III': 'trigonometriya',
  '8:IV': 'trigonometriya',
  '8:V': 'bukvennye',
  '3:I': 'kub',
  '3:II': 'prizma-piramida',
  '3:III': 'prizma-piramida',
  '3:IV': 'vrashcheniya',
  '3:V': 'vrashcheniya',
  '3:VI': 'vrashcheniya',
  '3:VII': 'kombinacii',
  '3:VIII': 'kombinacii',
};

export function znakiPodtipov(): Record<string, ZnakPodtipa> {
  const out: Record<string, ZnakPodtipa> = {};
  for (const s of SECTIONS) {
    const gruppy = GRUPPY[s.egeNumber]?.() ?? [];
    for (const st of s.subtypes) {
      const id = SOOTVETSTVIE[`${s.egeNumber}:${st.id}`] ?? st.id;
      const g = gruppy.find((x) => x.id === id);
      if (g === undefined) continue;
      out[`${s.egeNumber}:${st.id}`] = {
        html: g.znakHtml,
        ...(g.znak === undefined ? {} : { figura: g.znak }),
        ton: g.ton,
      };
    }
  }
  return out;
}

/** Подтипы без группы тренажёра — для проверки (scripts, отчёт). */
export function podtipyBezZnaka(): string[] {
  const znaki = znakiPodtipov();
  return SECTIONS.flatMap((s) =>
    s.subtypes
      .filter((st) => znaki[`${s.egeNumber}:${st.id}`] === undefined)
      .map((st) => `${s.egeNumber}:${st.id} ${st.label}`),
  );
}
