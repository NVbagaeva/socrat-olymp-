/**
 * Данные экрана тренажёра №11, собранные на сервере: разделы с
 * подтипами и счётчиками, условия банка без ответов и ссылки
 * подсказок (теория, лайфхак, опорный блок). Ответов здесь нет —
 * поле answer из bank.json сюда не переносится.
 */

import { RAZDELY_TEORII_11 } from '../../../content/teoriya11';
import { O_ZADANII_11 } from '../../../content/zadanie11';
import { ANALOGI } from '../analogi';
import { BANK, RAZMINKA } from '../bank';
import { BLOKI } from '../prep/bloki';
import { SUBTYPES } from '../prototypes';
import { kodNaSayte, SECTIONS } from '../taxonomy';
import type { SectionId } from '../types';
import type { RazdelInfo, UslovieBanka } from './sessiya';

export interface SsylkiRazdela {
  /** Якорь раздела теории. */
  teoriya: string;
  /** Опорный блок навыка для раздела: адрес и название. */
  opornyy: { slug: string; nazvanie: string } | null;
}

export interface DannyeTrenazhera {
  razdely: RazdelInfo[];
  bank: UslovieBanka[];
  ssylki: Record<SectionId, SsylkiRazdela>;
}

export function dannyeTrenazhera(): DannyeTrenazhera {
  const bank: UslovieBanka[] = [
    ...BANK.map((b, i) => ({ no: i + 1, id: b.id, params: b.params, razminka: false })),
    ...RAZMINKA.map((b, i) => ({ no: 1001 + i, id: b.id, params: b.params, razminka: true })),
    /* Аналоги — «новые» задачи: условие и сюжет, ответа нет. */
    ...ANALOGI.map((a, i) => ({
      no: 2001 + i,
      id: a.prototypeId,
      params: a.params,
      razminka: false,
      analog: { kod: a.id, tekst: a.text, plotTag: a.plotTag },
    })),
  ];
  const skolko = new Map<string, number>();
  for (const b of bank.filter((x) => x.analog === undefined)) {
    skolko.set(b.id, (skolko.get(b.id) ?? 0) + 1);
  }
  const razdely: RazdelInfo[] = SECTIONS.map((s) => ({
    id: s.id,
    kod: s.kod,
    nazvanie: s.nazvanie,
    podtipy: SUBTYPES.filter((st) => st.section === s.id).map((st) => ({
      id: st.id,
      kod: kodNaSayte(st.id),
      section: st.section,
      title: st.title,
      level: st.level,
      keywords: st.keywords,
      vBanke: skolko.get(st.id) ?? 0,
    })),
  }));
  const ssylki = Object.fromEntries(
    SECTIONS.map((s) => {
      const teoriya = RAZDELY_TEORII_11.find((r) => r.section === s.id)?.id ?? '';
      const svoi = BLOKI.find((b) => b.razdel === s.id);
      const pered = O_ZADANII_11.pered[s.id] ?? [];
      const blok = svoi ?? BLOKI.find((b) => pered.includes(b.nazvanie));
      return [
        s.id,
        {
          teoriya,
          opornyy: blok === undefined ? null : { slug: blok.slug, nazvanie: blok.nazvanie },
        },
      ];
    }),
  ) as Record<SectionId, SsylkiRazdela>;
  return { razdely, bank, ssylki };
}
