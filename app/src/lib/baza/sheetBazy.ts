/**
 * Печатный лист генератора базы на общем шаблоне lib/sheet: модель листа
 * (generatorBazy.ts) раскладывает общий сборщик lib/sheetList.ts.
 *
 *   Ученик  — условия, у №12 чертёж условия, строка «Ответ: ____».
 *   Учитель — ключ ответов, ответ у каждой задачи и краткий разбор по
 *             этапам решателя прототипа.
 */

import type { GenConfig } from '@/lib/generator/obshchiy/types';
import { shirinaRisunka } from '@/lib/planimetriya/shirina';
import { listSheetSpec, razborKuski, type ListVid } from '@/lib/sheetList';
import type { ModelListaBazy } from './generatorBazy';
import { otvetBazy, razborBazy, uslovieBazy } from './listBazy';
import type { ZadachiBazy } from './predprosmotrBazy';
import type { ZadachaLite } from './types';

export interface SborkaBazy {
  config: GenConfig;
  model: ModelListaBazy;
  dannye: ZadachiBazy;
}

/** Описание листа базы для buildDocument (lib/sheetList.ts). */
export function sheetSpecBazy(o: SborkaBazy, vid: ListVid) {
  const { config, dannye } = o;
  const spec = listSheetSpec<ZadachaLite>(
    {
      chip: config.sheet.chip,
      cls: 'baza',
      model: o.model,
      zadacha: (id) => dannye.zadacha(id),
      id: (z) => z.id,
      uslovie: (z) => ({
        html: uslovieBazy(z),
        figure:
          z.risunok === undefined ? null : { svg: z.risunok, width: shirinaRisunka(z.risunok) },
      }),
      otvet: (z) => otvetBazy(dannye.reshit(z).otvet),
      razbor: (z) => razborKuski(razborBazy(dannye.reshit(z).etapy), 'baza'),
      teoriya: () => [],
      /* Разобранных примеров у базы нет (generatorBazy.ts). */
      primer: () => '',
    },
    vid,
  );
  /* Курс в шапке и подвале — «Базовая математика», а не профиль. */
  const course = config.sheet.course;
  return {
    ...spec,
    head: { ...spec.head, course },
    foot: { ...spec.foot, course },
  };
}
