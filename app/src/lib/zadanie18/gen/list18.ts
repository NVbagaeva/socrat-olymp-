/**
 * Лист задания №18 общего генератора: адрес → план → задачи → описание
 * листа (lib/sheet/). Устройство — как у листа №3 (lib/zadanie3/gen/list3.ts).
 *
 * Задачи — банк тренажёра №18 (lib/zadanie18/trenazher/bank.ts): тип
 * задачи и три набора чисел. Банк собирается на сервере страницы, ответ
 * и решение закрыты отпечатком и раскрываются здесь — только на листе
 * учителя. Чертёж — неподвижная сцена движка схем по числам варианта
 * (lib/zadanie18/trenazher/sceny.ts), строкой SVG.
 *
 * Задача привязана к позиции в составе (lib/generator/obshchiy/klyuchi.ts):
 * правка состава не меняет остальные задачи. Один адрес — один и тот же
 * лист; листы ученика и учителя по одному адресу — одни и те же задачи.
 */

import { SHEET_GEN_18 } from '@/content/generator18';
import { planPoKlyucham, slotySostava, type SlotShablon } from '@/lib/generator/obshchiy/klyuchi';
import answers from '@/lib/sheet/answers.js';
import { VID_ISHODNYY } from '@/lib/skhemy/tipy';
import { svgSkhemy } from '@/lib/skhemy/svg';
import { rngOf } from '@/lib/vychisleniya/rng';
import type { ShagRazbora18, Zadacha18 } from '../trenazher/bank';
import { otkrytTekst18 } from '../trenazher/otvet';
import { scena18 } from '../trenazher/sceny';
import { subtitleOf18, type SheetParams18, type VidLista } from './params18';

export * from './params18';

export interface ListZadacha18 {
  /** «вариант.ключ позиции»: «2.bis-par_0». */
  pos: string;
  no: number;
  klyuch: string;
  questionHtml: string;
  figureSvg: string;
  solutionHtml: string;
  /** Ответ пункта б): «3,6». */
  answer: string;
}

export interface SobrannyyList18 {
  poVariantam: ListZadacha18[][];
  /** Задач, взятых повторно: одного типа на листе больше, чем вариантов чисел. */
  povtor: number;
}

/** Ширина чертежа на листе, мм. */
const SHIRINA = 62;

/** Перемешать по seed: тот же seed — тот же порядок. */
function peremeshat<T>(items: readonly T[], seed: string): T[] {
  const rnd = rngOf(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd.next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

interface Poz18 {
  klyuch: string;
  seed?: string;
}

/** Задачи листа по позициям: ключи банка «тип#вариант». */
export function planLista18(
  p: SheetParams18,
  bank: readonly Zadacha18[],
): { poVariantam: (Poz18 & { pos: string })[][]; povtor: number } {
  const sh: SlotShablon[] = slotySostava(p.sostav).map((s) => ({ ...s, istochnik: 'new' }));
  const tipa = (id: string) => bank.filter((z) => z.tip === id).map((z) => z.key);
  let povtor = 0;
  const plan = planPoKlyucham<SlotShablon, string, Poz18>({
    sh,
    variants: p.variants,
    seed: p.seed,
    zameny: p.zameny,
    mixSol: 'z18-mix',
    bank: () => [],
    analogi: (id) => peremeshat(tipa(id), `${p.seed}|a|${id}`),
    bankPoz: (klyuch) => ({ klyuch }),
    analogPoz: (klyuch) => ({ klyuch }),
    /* Варианты чисел типа кончились — повтор по seed позиции, по
       возможности не тот, что уже стоит на листе. */
    novaya: (c, seed, zanyato) => {
      const vse = tipa(c.s.id);
      const svobodnye = vse.filter((k) => !zanyato.has(k));
      const klyuch = rngOf(seed).pick(svobodnye.length > 0 ? svobodnye : vse);
      zanyato.add(klyuch);
      povtor += 1;
      return { klyuch, seed };
    },
    seedNovoy: (x) => x.seed,
  });
  return {
    poVariantam: plan.poVariantam.map((zs, vi) =>
      zs.map((z, i) => ({ ...z, pos: `${vi + 1}.${sh[i]?.id ?? ''}_${sh[i]?.k ?? 0}` })),
    ),
    povtor,
  };
}

/** Условие с пунктами а) и б) — одним блоком HTML (части уже набраны KaTeX на сервере). */
function uslovieHtml(z: Zadacha18): string {
  return (
    `<p>${z.uslovieHtml}</p>` +
    `<p><b>${SHEET_GEN_18.punktA}</b> ${z.aHtml}</p>` +
    `<p><b>${SHEET_GEN_18.punktB}</b> ${z.bHtml}</p>`
  );
}

function shagiHtml(shagi: readonly ShagRazbora18[]): string {
  return `<ol class="sheet-steps">${shagi
    .map((s) => `<li class="sheet-step">${s.html}</li>`)
    .join('')}</ol>`;
}

function zadachaLista(z: Zadacha18, pos: string, no: number): ListZadacha18 {
  const r = JSON.parse(otkrytTekst18(z.key, z.razbor, z.seal)) as {
    a: ShagRazbora18[];
    b: ShagRazbora18[];
  };
  const sk = scena18(z.tip, z.p);
  const figure = svgSkhemy(
    sk,
    sk.nachalo,
    VID_ISHODNYY,
    { lit: new Set(), shag: null, podpisi: true },
    { W: 360, H: 250, opisanie: '' },
  );
  return {
    pos,
    no,
    klyuch: z.key,
    questionHtml: uslovieHtml(z),
    figureSvg: `<span class="skh">${figure}</span>`,
    solutionHtml:
      `<p class="sheet-step-head"><b>${SHEET_GEN_18.dokA}</b></p>${shagiHtml(r.a)}` +
      `<p class="sheet-step-head"><b>${SHEET_GEN_18.reshB}</b></p>${shagiHtml(r.b)}`,
    answer: otkrytTekst18(z.key, z.otvet, z.seal),
  };
}

export function sobratList18(p: SheetParams18, bank: readonly Zadacha18[]): SobrannyyList18 {
  const poKlyuchu = new Map(bank.map((z) => [z.key, z]));
  const plan = planLista18(p, bank);
  return {
    poVariantam: plan.poVariantam.map((zs) =>
      zs.flatMap((x, i) => {
        const z = poKlyuchu.get(x.klyuch);
        return z === undefined ? [] : [zadachaLista(z, x.pos, i + 1)];
      }),
    ),
    povtor: plan.povtor,
  };
}

/* ── Лист ───────────────────────────────────────────────────────── */

/** «2026-10-24» → «24.10.2026». */
function dataNaListe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? '' : `${m[3]}.${m[2]}.${m[1]}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ б):<span class="sheet-answer-blank"></span></p>';

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: string;
  figureWidth: number;
  solutionHtml: string | null;
}

/**
 * Описание листа. Ученику — условие с пунктами а) и б), чертёж и строка
 * «Ответ б): ____»; учителю — те же задачи с доказательством а),
 * решением б) и ответом, в конце — таблица ответов б). «Всё одним
 * файлом» — листы учеников всех вариантов, затем листы учителя.
 */
export function sheetSpec18(
  p: SheetParams18,
  list: SobrannyyList18,
  vid: VidLista,
  /** QR-код на лист, SVG: считает страница печати по своему адресу. */
  qrSvg?: string,
) {
  const dop = p.dop;
  const title = (variant?: string, uchitel = false) => ({
    chip: SHEET_GEN_18.title.chip,
    text: SHEET_GEN_18.title.text,
    subtitle: subtitleOf18(p) + (uchitel ? ` · ${SHEET_GEN_18.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
    ...(dop.qr && qrSvg !== undefined ? { qr: qrSvg } : {}),
  });
  const uchenikTask =
    (sStrokoy: boolean) =>
    (z: ListZadacha18): SheetTask => ({
      no: z.no,
      id: z.pos,
      questionHtml: z.questionHtml,
      options: null,
      figureSvg: z.figureSvg,
      figureWidth: SHIRINA,
      solutionHtml: sStrokoy ? STROKA_OTVETA : null,
    });
  const uchitelTask = (z: ListZadacha18): SheetTask => ({
    no: z.no,
    id: z.pos,
    questionHtml: z.questionHtml,
    options: null,
    figureSvg: z.figureSvg,
    figureWidth: SHIRINA,
    solutionHtml: `${z.solutionHtml}<p class="sheet-task-answer">${SHEET_GEN_18.otvet} б): <b>${escapeHtml(z.answer)}</b></p>`,
  });
  const nV = list.poVariantam.length;
  const variantTitle = (i: number) => (nV > 1 ? SHEET_GEN_18.variant(i + 1) : undefined);
  const blok = (zs: ListZadacha18[], task: (z: ListZadacha18) => SheetTask) => [
    { head: false, title: '', note: '', tasks: zs.map(task) },
  ];
  const uchenik = (sStrokoy: boolean) =>
    list.poVariantam.map((zs, i) => ({
      title: title(variantTitle(i)),
      blocks: blok(zs, uchenikTask(sStrokoy)),
    }));
  const uchitel = () =>
    list.poVariantam.map((zs, i) => ({
      title: title(variantTitle(i), true),
      blocks: blok(zs, uchitelTask),
    }));
  const poVariantam =
    vid === 'uchenik'
      ? uchenik(false)
      : vid === 'uchitel'
        ? uchitel()
        : [...uchenik(true), ...uchitel()];
  const otvety: string[] =
    vid === 'uchenik'
      ? []
      : [
          answers.sectionHead(SHEET_GEN_18.otvety, SHEET_GEN_18.otvetyNote, { section: nV > 1 }),
          ...list.poVariantam.flatMap((zs, i) => [
            ...(nV > 1 ? [answers.subHead(SHEET_GEN_18.variant(i + 1))] : []),
            answers.table(
              SHEET_GEN_18.otvety,
              zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
              5,
            ),
          ]),
        ];
  const one = poVariantam.length === 1 ? poVariantam[0] : undefined;
  return {
    theme: p.theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_GEN_18.title.chip}. ${SHEET_GEN_18.title.text} — ${subtitleOf18(p)}`,
    head: { ...SHEET_GEN_18.head, author: dop.uchitel },
    runner: SHEET_GEN_18.runner,
    title: one?.title ?? title(),
    recap: null,
    blocks: one?.blocks ?? [],
    fields: { date: dataNaListe(dop.data) },
    ...(one === undefined ? { variants: poVariantam } : {}),
    withAnswerLine: vid === 'uchenik',
    extraItems: otvety,
    foot: SHEET_GEN_18.foot,
  };
}
