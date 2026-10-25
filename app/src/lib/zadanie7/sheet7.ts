/**
 * Печатный лист №7 на общем шаблоне lib/sheet: модель листа
 * (sborka.ts) раскладывает общий сборщик lib/sheetList.ts, разметку
 * своих задач дают компоненты раздела (Razbor7, KartochkaTelo7) —
 * без состояния, поэтому отрисовываются в строку.
 *
 *   Ученик  — условия и строка «Ответ: ____».
 *   Учитель — ключ, ответы и разбор по шагам; этапы «ОДЗ» и «Отбор
 *             корней» выделены (стили razbor7.css).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KartochkaTelo7 } from '@/components/tasks/zadanie7/KartochkaTelo7';
import { Razbor7 } from '@/components/tasks/zadanie7/Razbor7';
import { RamkaPrimer } from '@/components/teoriya/Ramki';
import { Tex } from '@/components/ui/Tex';
import { TEORIYA_7_DLYA_PROTOTIPA, vseKartochki7, type Kartochka7 } from '@/content/teoriya7';
import { GENERATOR_7 } from '@/content/zadanie7';
import typo from '@/lib/sheet/typography.js';
import { listSheetSpec, razborKuski, type ListVid } from '@/lib/sheetList';
import type { ZadachaLite } from './dannye';
import type { ModelLista } from './sborka';
import type { Solved } from './types';

export type Vid7 = ListVid;

export interface Sborka7 {
  model: ModelLista;
  zadachi: ReadonlyMap<string, ZadachaLite>;
  reshit: (z: ZadachaLite) => Solved;
}

/** Ответ строкой: десятичная запятая и настоящий минус. */
export function otvetText7(x: number): string {
  return String(x).replace('.', ',').replace('-', '−');
}

function ramkiTeorii(prototipy: readonly string[]): string[] {
  const vse = vseKartochki7();
  const ids = [...new Set(prototipy.flatMap((p) => TEORIYA_7_DLYA_PROTOTIPA(p)?.kartochka ?? []))];
  return ids
    .flatMap((id) => vse.find((k) => k.id === id) ?? [])
    .map((k) => renderToStaticMarkup(createElement(KartochkaTelo7, { k: k as Kartochka7 })));
}

function uslovie(z: ZadachaLite): string {
  const metka =
    z.source === 'analog'
      ? ` <span class="z7-list__metka">${typo.escape(GENERATOR_7.analogMetka)}</span>`
      : '';
  return `<p class="z7-list__uslovie">${renderToStaticMarkup(createElement(Tex, { text: z.text }))}${metka}</p>`;
}

/** Описание листа №7 для buildDocument (lib/sheetList.ts). */
export function sheetSpec7(o: Sborka7, vid: Vid7) {
  return listSheetSpec<ZadachaLite>(
    {
      chip: 'Задание 7',
      cls: 'z7',
      model: o.model,
      zadacha: (id) => o.zadachi.get(id),
      id: (z) => z.id,
      uslovie: (z) => ({ html: uslovie(z), figure: null }),
      otvet: (z) => otvetText7(o.reshit(z).answer),
      razbor: (z) =>
        razborKuski(renderToStaticMarkup(createElement(Razbor7, { s: o.reshit(z) })), 'z7'),
      teoriya: ramkiTeorii,
      primer: (z) => {
        const s = o.reshit(z);
        return renderToStaticMarkup(
          createElement(RamkaPrimer, {
            title: TEORIYA_7_DLYA_PROTOTIPA(z.prototypeId)?.title ?? '',
            uslovie: z.text,
            shagi: s.etapy.map((e) => ({
              label: e.title.replace(/^Шаг \d+\.\s*/, ''),
              paras: e.lines,
            })),
          }),
        );
      },
    },
    vid,
  );
}
