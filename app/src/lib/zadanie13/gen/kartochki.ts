/**
 * Карточки «Определи тип» для печати (02-design.md, § 6): двадцать
 * карточек, по пять каждой схемы. Лицо — условие задачи банка, оборот
 * — схема словами и признак. Карточку вырезают по сплошной линии и
 * сгибают по пунктиру; оборот повёрнут, чтобы читаться после сгиба.
 *
 * В наборе — спорные пары из анализа (§ 2.5): таблица долга с равным
 * шагом и таблица долей, известные некоторые платежи и известные все
 * платежи, снятия до нуля и равные платежи. Seed задач и порядок
 * карточек — от seed серии: та же серия — те же карточки.
 */

import { KARTOCHKI_13 } from '@/content/repetitory13';
import { SHEET_13 } from '@/content/generator13';
import { rngOf } from '../../vychisleniya/rng';
import { BANK_13 } from '../bank';
import { SIGN } from '../proto/common';
import { TYPE_NAMES, type TypeCode } from '../types';
import { sobratZadachu13, tablitsaUsloviya13 } from './list';

/** По пять прототипов каждой схемы; спорные пары — первыми. */
export const PROTOTIPY_KARTOCHEK_13: Record<TypeCode, readonly string[]> = {
  A: ['A-09', 'A-01', 'A-05', 'A-18', 'A-13'],
  B: ['B-01', 'B-18', 'B-04', 'B-09', 'B-13'],
  C: ['C-14', 'C-12', 'C-02', 'C-08', 'C-06'],
  D: ['D-06', 'D-01', 'D-03', 'D-05', 'D-13'],
};

export interface Kartochka13 {
  no: number;
  prototypeId: string;
  seed: string;
  type: TypeCode;
}

export function kartochki13(seed: string): Kartochka13[] {
  const vse = (Object.keys(PROTOTIPY_KARTOCHEK_13) as TypeCode[]).flatMap((type) =>
    PROTOTIPY_KARTOCHEK_13[type].map((prototypeId) => {
      const own = BANK_13.filter(([id]) => id === prototypeId).map(([, s]) => s);
      const s = rngOf(`z13-kart|${seed}|${prototypeId}`).pick(own) ?? 'b1';
      return { prototypeId, seed: s, type };
    }),
  );
  return rngOf(`z13-kart|${seed}|poryadok`)
    .sample(vse, vse.length)
    .map((k, i) => ({ ...k, no: i + 1 }));
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function kartochkaHtml(k: Kartochka13): string {
  const z = sobratZadachu13({
    pos: `1.${k.no}`,
    no: k.no,
    vid: 'T',
    prototypeId: k.prototypeId,
    seed: k.seed,
    istochnik: 'bank',
  });
  return (
    `<div class="sheet-item z13-kartochka">` +
    `<div class="z13-kartochka__lico">` +
    `<span class="z13-kartochka__no">${k.no}</span>` +
    `<div class="z13-kartochka__uslovie"><p>${z.questionHtml}</p>${tablitsaUsloviya13(z)}</div>` +
    `</div>` +
    `<div class="z13-kartochka__oborot">` +
    `<p class="z13-kartochka__skhema"><span>${KARTOCHKI_13.kartochka} ${k.no}</span>` +
    `<b>${escape(TYPE_NAMES[k.type])}</b></p>` +
    `<p>${KARTOCHKI_13.priznak}: ${escape(SIGN[k.type])}.</p>` +
    `</div></div>`
  );
}

/** Описание листа карточек для lib/sheet. */
export function kartochkiSpec13(seed: string, theme: 'color' | 'print', teacher: string) {
  const items = kartochki13(seed).map(kartochkaHtml);
  return {
    theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_13.chip}. ${KARTOCHKI_13.title}`,
    head: { ...SHEET_13.head, author: teacher || SHEET_13.uchitel },
    runner: SHEET_13.runner,
    title: { chip: SHEET_13.chip, text: KARTOCHKI_13.title, subtitle: KARTOCHKI_13.lead },
    recap: null,
    blocks: [{ title: '', note: '', head: false, leadItems: items, tasks: [] }],
    withAnswerLine: false,
    extraItems: [] as string[],
    foot: SHEET_13.foot,
  };
}
