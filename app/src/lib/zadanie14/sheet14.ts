/**
 * Печатный лист генератора №14 для lib/sheet: тот же набор задач, что в
 * предпросмотре генератора. Ученику — условия и пустая окружность для
 * отбора (без построений), перед первой задачей метода — «Запомни» и
 * образец, если они включены. Учителю — сводка ответов, затем решения
 * с окружностями отбора.
 */

import answers from '../sheet/answers.js';
import { SHEET_14 } from '@/content/generator14';
import {
  krugUchitelya,
  leadPozicii,
  otvetHtml,
  planLista14,
  PUSTOY_KRUG,
  resheniyeHtml,
  uslovieHtml,
  zagolovok14,
  type Params14,
  type Poziciya14,
} from './generator14';

export type VidPechati14 = 'uchenik' | 'uchitel' | 'vse';

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  solutionHtml: string | null;
}

interface SheetBlock {
  title: string;
  note: string;
  head?: boolean;
  leadItems?: string[];
  tasks: SheetTask[];
}

function dataNaListe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? iso : `${m[3]}.${m[2]}.${m[1]}`;
}

function uchenikBloki(p: Params14, ryad: Poziciya14[]): SheetBlock[] {
  return ryad.map((poz, i) => {
    const lead = leadPozicii(p, ryad, i);
    return {
      title: '',
      note: '',
      head: false,
      leadItems: lead === '' ? [] : [`<div class="sheet-item">${lead}</div>`],
      tasks: [
        {
          no: poz.no,
          id: poz.pos,
          questionHtml: `<div class="z14-list-zadacha"><div>${uslovieHtml(poz.z)}</div>${PUSTOY_KRUG()}</div>`,
          options: null,
          figureSvg: null,
          solutionHtml: null,
        },
      ],
    };
  });
}

function uchitelBloki(ryad: Poziciya14[]): SheetBlock[] {
  return ryad.flatMap((poz) => [
    {
      title: '',
      note: '',
      head: false,
      tasks: [
        {
          no: poz.no,
          id: poz.pos,
          questionHtml: uslovieHtml(poz.z),
          options: null,
          figureSvg: null,
          solutionHtml: null,
        },
      ],
    },
    {
      title: '',
      note: '',
      head: false,
      leadItems: [
        `<div class="sheet-item z14-list-reshenie">${resheniyeHtml(poz.z)}${krugUchitelya(poz.z)}</div>`,
      ],
      tasks: [],
    },
  ]);
}

export function sheetSpec14(p: Params14, vid: VidPechati14) {
  const plan = planLista14(p);
  const nV = plan.length;
  const zag = zagolovok14(p) || SHEET_14.text;
  const title = (variant: number | null, uchitel: boolean) => ({
    chip: SHEET_14.chip,
    text: uchitel ? `${zag} · ${SHEET_14.resheniya}` : zag,
    subtitle: SHEET_14.text,
    ...(variant === null || nV === 1 ? {} : { variant: `Вариант ${variant + 1}` }),
  });
  const uchenik = (ryad: Poziciya14[], i: number) => ({ title: title(i, false), blocks: uchenikBloki(p, ryad) });
  const uchitel = (ryad: Poziciya14[], i: number) => {
    const b = uchitelBloki(ryad);
    const svodka = answers.table(
      nV > 1 ? `${SHEET_14.svodka}. Вариант ${i + 1}` : SHEET_14.svodka,
      ryad.map((poz) => ({ no: poz.no, answer: poz.z.id, html: otvetHtml(poz.z) })),
      1,
    );
    if (b[0] !== undefined) b[0] = { ...b[0], leadItems: [svodka, ...(b[0].leadItems ?? [])] };
    return { title: title(i, true), blocks: b };
  };
  const variants =
    vid === 'uchenik'
      ? plan.map(uchenik)
      : vid === 'uchitel'
        ? plan.map(uchitel)
        : [...plan.map(uchenik), ...plan.map(uchitel)];
  const one = variants.length === 1 ? variants[0] : undefined;
  return {
    theme: 'color' as const,
    layout: 'single' as const,
    documentTitle: `${SHEET_14.chip}. ${zag}`,
    head: { ...SHEET_14.head, author: p.teacher || SHEET_14.uchitel },
    runner: SHEET_14.runner,
    title: one?.title ?? title(null, vid === 'uchitel'),
    recap: null,
    blocks: one?.blocks ?? [],
    ...(vid === 'uchitel' ? {} : { fields: { date: dataNaListe(p.date) } }),
    ...(one === undefined ? { variants } : {}),
    withAnswerLine: false,
    extraItems: [] as string[],
    foot: SHEET_14.foot,
  };
}
