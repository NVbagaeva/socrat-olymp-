/**
 * Лист задания №3 общего генератора: адрес → план → задачи → описание
 * листа (lib/sheet/). Устройство — как у листа №1
 * (lib/planimetriya/sheet1.ts), только без прежних адресов и уроков.
 *
 * Всё, что определяет лист, живёт в адресе: источник, состав по ключам
 * позиций («P03-19.0:2»), число вариантов, seed, замены и
 * «Дополнительно» (QR-код, вид работы, дата, учитель). Один адрес —
 * один и тот же лист; листы ученика и учителя по одному адресу
 * содержат одни и те же задачи.
 *
 * Задачи — варианты банка (по десять на прототип): варианты из
 * открытого банка ФИПИ — «банк», остальные — «не из банка». Задача
 * привязана к позиции в составе (lib/generator/obshchiy/klyuchi.ts):
 * правка состава не меняет остальные задачи. Сами задачи закрыты так
 * же, как на листе печати №3 (pechat-dannye.ts), и раскрываются
 * отпечатком ответа; чертёж I–III — сценарий (ученику без построений,
 * учителю — с ними), IV–VIII — SVG движка solid/.
 */

import { SHEET_GEN_3 } from '@/content/generator3';
import { GEN_UI } from '@/content/generatorUi';
import { planPoKlyucham, slotySostava, type SlotShablon } from '@/lib/generator/obshchiy/klyuchi';
import { katex } from '@/lib/graph/katex';
import answers from '@/lib/sheet/answers.js';
import { typesetKrupno } from '@/lib/tex';
import type { Dannye03, Zadacha03 } from '@/lib/variant/data/z03';
import { rngOf } from '@/lib/vychisleniya/rng';
import { chertezhLista } from '../pechat';
import type { ZadachaPechati } from '../pechat-dannye';
import { openText } from '../secret';
import type { Scenariy } from '@/lib/chertezh3/scenariy';
import { orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { dannye3dJson } from '@/lib/stereo/zhivoy';
import type { Razdel3 } from './info';
import { subtitleOf, type SheetParams3, type VidLista } from './params3';

export * from './params3';

/* ── Задачи ─────────────────────────────────────────────────────── */

/** Задача на позиции листа: вариант прототипа и откуда он. */
interface Poz3 {
  klyuch: string;
  vid: 'bank' | 'drugoy';
  /** Seed повтора: задачи прототипа кончились, вариант выбран заново. */
  seed?: string;
}

export interface ListZadacha3 {
  /** «вариант.ключ позиции»: «2.P03-19_0». */
  pos: string;
  no: number;
  klyuch: string;
  prototip: string;
  fromBank: boolean;
  questionHtml: string;
  figureSvg: string | null;
  figureUchitelSvg: string | null;
  figureWidth: number;
  /** Данные живого чертежа для предпросмотра (lib/stereo/zhivoy.ts). */
  zhivoy?: string;
  zhivoyUchitel?: string;
  solutionHtml: string;
  /** Ответ: «1,5». */
  answer: string;
}

export interface SobrannyyList3 {
  poVariantam: ListZadacha3[][];
  nehvatka: number;
}

/** Ширина чертежа на листе, мм: сценарий — как на листе печати №3, SVG solid/ — уже. */
const SHIRINA_SCENARIYA = 64;
const SHIRINA_SOLID = 60;

const OTVET = /^\s*\*{0,2}Ответ:/;

function tex(t: string): string {
  return katex.renderToString(t, { throwOnError: false });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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

/** Задачи листа по позициям — без чертежей и формул. */
export function planLista3(
  p: SheetParams3,
  razdely: readonly Razdel3[],
): { poVariantam: (Poz3 & { pos: string })[][]; nehvatka: number } {
  const proto = new Map(razdely.flatMap((r) => r.prototipy.map((x) => [x.id, x])));
  const sh: SlotShablon[] = slotySostava(p.sostav).map((s) => ({ ...s, istochnik: p.istochnik }));
  const iz = (id: string, bank: boolean): string[] => {
    const x = proto.get(id);
    if (x === undefined) return [];
    const b = new Set(x.bank);
    return x.varianty.filter((n) => b.has(n) === bank).map((n) => `${id}#${n}`);
  };
  const plan = planPoKlyucham<SlotShablon, string, Poz3>({
    sh,
    variants: p.variants,
    seed: p.seed,
    zameny: p.zameny,
    mixSol: 'z3-mix',
    bank: (id) => peremeshat(iz(id, true), `${p.seed}|b|${id}`),
    analogi: (id) => peremeshat(iz(id, false), `${p.seed}|a|${id}`),
    bankPoz: (klyuch) => ({ klyuch, vid: 'bank' }),
    analogPoz: (klyuch) => ({ klyuch, vid: 'drugoy' }),
    /* Задачи прототипа кончились (больше десяти на лист) — вариант по
       seed позиции, по возможности не тот, что уже стоит на листе. */
    novaya: (c, seed, zanyato) => {
      const vse = [...iz(c.s.id, true), ...iz(c.s.id, false)];
      const svobodnye = vse.filter((k) => !zanyato.has(k));
      const klyuch = rngOf(seed).pick(svobodnye.length > 0 ? svobodnye : vse);
      zanyato.add(klyuch);
      const bank = proto.get(c.s.id)?.bank.includes(Number(klyuch.split('#')[1])) === true;
      return { klyuch, vid: bank ? 'bank' : 'drugoy', seed };
    },
    seedNovoy: (x) => x.seed,
  });
  return {
    poVariantam: plan.poVariantam.map((zs, vi) =>
      zs.map((z, i) => ({ ...z, pos: `${vi + 1}.${sh[i]?.id ?? ''}_${sh[i]?.k ?? 0}` })),
    ),
    nehvatka: plan.nehvatka,
  };
}

/** Задача листа из записи банка: условие, чертежи, решение и ответ. */
function zadachaLista(
  z: Zadacha03,
  d: Dannye03,
  pos: string,
  no: number,
  bank: boolean,
  /** Ракурс из предпросмотра: [азимут, подъём]; нет — ракурс задачи. */
  rk?: [number, number],
): ListZadacha3 {
  const otvet = openText(z.otvet, z.seal);
  const shagi = openText(z.shagi, z.seal)
    .split('\n')
    .filter((t) => t.trim() !== '' && !OTVET.test(t));
  let figure: string | null;
  let figureUchitel: string | null;
  let width: number;
  let zhivoy: string | undefined;
  let zhivoyUchitel: string | undefined;
  if (z.scena !== '') {
    /* Листу печати от записи нужны только сценарий и отпечаток. */
    const zp: ZadachaPechati = { ...z, nazvanie: '' };
    const rakurs = rk === undefined ? undefined : { azimut: rk[0], vysota: rk[1] };
    figure = chertezhLista(zp, 'uchenik', tex, rakurs);
    figureUchitel = chertezhLista(zp, 'uchitel', tex, rakurs);
    width = SHIRINA_SCENARIYA;
    const sc = JSON.parse(openText(z.scena, z.seal)) as Scenariy;
    zhivoy = dannye3dJson({ sc });
    zhivoyUchitel = dannye3dJson({ sc, vspom: true });
  } else {
    const m = d.model?.[z.klyuch] ?? d.model?.[z.prototip];
    figure =
      rk !== undefined && m !== undefined
        ? renderSolid(m, { view: orthoAt(rk[0], rk[1]) })
        : (d.svg[z.klyuch] ?? d.svg[z.prototip] ?? null);
    figureUchitel = figure;
    width = SHIRINA_SOLID;
    if (m !== undefined) zhivoy = dannye3dJson({ m });
  }
  return {
    pos,
    no,
    klyuch: z.klyuch,
    prototip: z.prototip,
    fromBank: bank,
    questionHtml: typesetKrupno(z.uslovie),
    figureSvg: figure,
    figureUchitelSvg: figureUchitel,
    figureWidth: width,
    ...(zhivoy === undefined ? {} : { zhivoy }),
    ...(zhivoyUchitel === undefined ? {} : { zhivoyUchitel }),
    solutionHtml: `<ol class="sheet-steps">${shagi
      .map((t) => `<li class="sheet-step">${typesetKrupno(t)}</li>`)
      .join('')}</ol>`,
    answer: otvet,
  };
}

export function sobratList3(
  p: SheetParams3,
  razdely: readonly Razdel3[],
  d: Dannye03,
): SobrannyyList3 {
  const poKlyuchu = new Map(d.zadachi.map((z) => [z.klyuch, z]));
  const plan = planLista3(p, razdely);
  return {
    poVariantam: plan.poVariantam.map((zs) =>
      zs.flatMap((x, i) => {
        const z = poKlyuchu.get(x.klyuch);
        return z === undefined
          ? []
          : [zadachaLista(z, d, x.pos, i + 1, x.vid === 'bank', p.rakursy?.[x.pos])];
      }),
    ),
    nehvatka: plan.nehvatka,
  };
}

/* ── Лист ───────────────────────────────────────────────────────── */

/** «2026-10-24» → «24.10.2026». */
function dataNaListe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? '' : `${m[3]}.${m[2]}.${m[1]}`;
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: string | null;
  figureWidth: number;
  solutionHtml: string | null;
}

/**
 * Описание листа. Ученику — условие, чертёж без построений и строка
 * «Ответ: ____»; учителю — те же задачи с чертежом со всеми
 * построениями, решением по шагам и ответом, в конце — ответы и строка
 * источника у каждого варианта. «Всё одним файлом» — листы учеников
 * всех вариантов, затем листы учителя.
 */
export function sheetSpec3(
  p: SheetParams3,
  list: SobrannyyList3,
  vid: VidLista,
  /** QR-код на лист, SVG: считает страница печати по своему адресу. */
  qrSvg?: string,
) {
  const dop = p.dop;
  const title = (variant?: string, uchitel = false) => ({
    chip: SHEET_GEN_3.title.chip,
    text: SHEET_GEN_3.title.text,
    subtitle: subtitleOf(p) + (uchitel ? ` · ${SHEET_GEN_3.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
    ...(dop.qr && qrSvg !== undefined ? { qr: qrSvg } : {}),
  });
  const uchenikTask =
    (sStrokoy: boolean) =>
    (z: ListZadacha3): SheetTask => ({
      no: z.no,
      id: z.pos,
      questionHtml: z.questionHtml,
      options: null,
      figureSvg: z.figureSvg,
      figureWidth: z.figureWidth,
      solutionHtml: sStrokoy ? STROKA_OTVETA : null,
    });
  const uchitelTask = (z: ListZadacha3): SheetTask => ({
    no: z.no,
    id: z.pos,
    questionHtml: z.questionHtml,
    options: null,
    figureSvg: z.figureUchitelSvg,
    figureWidth: z.figureWidth,
    solutionHtml: `${z.solutionHtml}<p class="sheet-task-answer">${SHEET_GEN_3.otvet}: <b>${escapeHtml(z.answer)}</b></p>`,
  });
  const nV = list.poVariantam.length;
  const variantTitle = (i: number) => (nV > 1 ? SHEET_GEN_3.variant(i + 1) : undefined);
  const blok = (zs: ListZadacha3[], task: (z: ListZadacha3) => SheetTask) => [
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
          answers.sectionHead(SHEET_GEN_3.otvety, SHEET_GEN_3.otvetyNote, { section: nV > 1 }),
          ...list.poVariantam.flatMap((zs, i) => [
            ...(nV > 1 ? [answers.subHead(SHEET_GEN_3.variant(i + 1))] : []),
            `<div class="sheet-item z3-sheet-istochnik">${GEN_UI.istochnikStroka(
              zs.filter((z) => z.fromBank).map((z) => z.no),
              zs.length,
            )}</div>`,
            answers.table(
              SHEET_GEN_3.otvety,
              zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
              5,
            ),
          ]),
        ];
  const one = poVariantam.length === 1 ? poVariantam[0] : undefined;
  return {
    theme: p.theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_GEN_3.title.chip}. ${SHEET_GEN_3.title.text} — ${subtitleOf(p)}`,
    head: { ...SHEET_GEN_3.head, author: dop.uchitel },
    runner: SHEET_GEN_3.runner,
    title: one?.title ?? title(),
    recap: null,
    blocks: one?.blocks ?? [],
    fields: { date: dataNaListe(dop.data) },
    ...(one === undefined ? { variants: poVariantam } : {}),
    withAnswerLine: vid === 'uchenik',
    extraItems: otvety,
    foot: SHEET_GEN_3.foot,
  };
}
