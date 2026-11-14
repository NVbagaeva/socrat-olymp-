/**
 * Ссылки под условием задачи тренажёра №1 — как у прежнего тренажёра:
 * «Повторить теорию» (карточка справочника с этим типом), «Полезный
 * факт» (раздел «Полезные факты» справочника), «Опорный блок» и «Разбор
 * типа» (карточка типа на «О задании»). Собираются на сборке: в браузер
 * уходят только адреса.
 */

import { RAZDELY_SPRAVOCHNIKA_1 } from '../../../content/spravochnik1';
import { PROTOTIPY } from '../stseny';
import { opornyyDlya } from '../trenazher/dannye';
import { klyuchProto } from '../trenazher/sessiya';
import { RAZDEL1, blokHref1, tipHref1 } from './links';

export interface SsylkiTipa1 {
  teoriya?: string;
  fakt?: string;
  opornye: string;
  razbor: string;
}

/** Раздел справочника с полезными фактами: из него — «Полезный факт». */
const FAKTY = 'poleznye-fakty';

export function ssylki1(): Record<string, SsylkiTipa1> {
  const temy = RAZDELY_SPRAVOCHNIKA_1.flatMap((r) => r.temy.map((t) => ({ razdel: r.id, t })));
  return Object.fromEntries(
    PROTOTIPY.map((p) => {
      const k = klyuchProto(p.id);
      const svoi = temy.filter(({ t }) => t.prototipy.includes(p.id));
      const teoriya = svoi.find(({ razdel }) => razdel !== FAKTY);
      const fakt = svoi.find(({ razdel }) => razdel === FAKTY);
      return [
        k,
        {
          ...(teoriya === undefined ? {} : { teoriya: `${RAZDEL1}teoriya/#k-${teoriya.t.id}` }),
          ...(fakt === undefined ? {} : { fakt: `${RAZDEL1}teoriya/#k-${fakt.t.id}` }),
          opornye: blokHref1(opornyyDlya(p.id, p.blok)),
          razbor: tipHref1(k),
        },
      ];
    }),
  );
}
