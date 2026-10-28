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
import {
  planPoKlyucham,
  razobratSostav,
  slotySostava,
  sostavStroka,
  type SlotShablon,
} from '@/lib/generator/obshchiy/klyuchi';
import { SVOY_MAX } from '@/lib/generator/obshchiy/state';
import type { SourceId } from '@/lib/generator/obshchiy/types';
import { katex } from '@/lib/graph/katex';
import answers from '@/lib/sheet/answers.js';
import { typesetKrupno } from '@/lib/tex';
import type { Dannye03, Zadacha03 } from '@/lib/variant/data/z03';
import { rngOf } from '@/lib/vychisleniya/rng';
import { chertezhLista } from '../pechat';
import type { ZadachaPechati } from '../pechat-dannye';
import { openText } from '../secret';
import type { Razdel3 } from './info';

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

export type VidRaboty3 = keyof typeof SHEET_GEN_3.vidy;

/** «Дополнительно» генератора: QR-код, вид работы, дата и учитель в шапке. */
export interface Dop3 {
  qr: boolean;
  /** Вид работы в шапке; null — «Задания для отработки». */
  vid: VidRaboty3 | null;
  /** Свой заголовок вместо вида работы из списка (vid — null). */
  svoy?: string;
  /** Дата на листе: «2026-10-24»; пусто — пустая линия. */
  data: string;
  uchitel: string;
}

export const DOP_3: Dop3 = {
  qr: false,
  vid: null,
  data: '',
  uchitel: SHEET_GEN_3.head.author,
};

export interface SheetParams3 {
  istochnik: SourceId;
  /** Состав: прототип, сколько задач и ключ первой из них. */
  sostav: { id: string; n: number; k?: number }[];
  variants: number;
  seed: string;
  /** Замены: «вариант.ключ» («2.P03-19_0») → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Задачи привязаны к ключам позиций — у №3 всегда. */
  poKlyucham: true;
  theme: 'color' | 'print';
  dop: Dop3;
}

export const VARIANTS_MAX_3 = 8;

/* ── Адрес ──────────────────────────────────────────────────────── */

const ISTOCHNIK_KOD: Record<SourceId, string> = { bank: 'b', mix: 'm', new: 'n' };
const PROTOTIP_RE = /P03-\d{2}/;

export function sheetQuery3(p: SheetParams3): string {
  const q = new URLSearchParams();
  q.set('i', ISTOCHNIK_KOD[p.istochnik]);
  q.set('s', sostavStroka(p.sostav));
  if (p.variants > 1) q.set('v', String(p.variants));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  if (p.theme === 'print') q.set('t', 'print');
  const d = p.dop;
  if (d.qr) q.set('qr', '1');
  if (d.vid !== null) q.set('vr', d.vid);
  else if (d.svoy !== undefined && d.svoy !== '') q.set('vt', d.svoy);
  if (d.data !== '') q.set('d', d.data);
  if (d.uchitel !== DOP_3.uchitel) q.set('uch', d.uchitel);
  return q.toString();
}

/** Строка из адреса: без разметки и не длиннее max. */
function chistyy(text: string, max: number): string {
  return text.replace(/[<>]/g, '').trim().slice(0, max);
}

/** Есть ли такой прототип — проверяет вызывающий: у листа нет банка. */
export function parseSheetQuery3(
  q: URLSearchParams,
  est: (id: string) => boolean = () => true,
): SheetParams3 {
  const i = q.get('i');
  const istochnik: SourceId = i === 'b' ? 'bank' : i === 'n' ? 'new' : 'mix';
  const v = Number(q.get('v') ?? '1');
  const zameny: Record<string, number> = {};
  for (const x of (q.get('z') ?? '').split(',')) {
    const m = /^(\d+\.P03-\d{2}_\d+):(\d+)$/.exec(x);
    if (m !== null) zameny[m[1] as string] = Math.min(50, Number(m[2]));
  }
  const vr = q.get('vr') ?? '';
  const vid = vr in SHEET_GEN_3.vidy ? (vr as VidRaboty3) : null;
  const vt = chistyy(q.get('vt') ?? '', SVOY_MAX);
  const d = q.get('d') ?? '';
  return {
    istochnik,
    sostav: razobratSostav(q.get('s') ?? '', true, PROTOTIP_RE, est),
    variants: Number.isInteger(v) ? Math.max(1, Math.min(VARIANTS_MAX_3, v)) : 1,
    seed: chistyy(q.get('seed') ?? '', 12) || '0000',
    zameny,
    poKlyucham: true,
    theme: q.get('t') === 'print' ? 'print' : 'color',
    dop: {
      qr: q.get('qr') === '1',
      vid,
      ...(vid === null && vt !== '' ? { svoy: vt } : {}),
      data: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '',
      uchitel: chistyy(q.get('uch') ?? '', 60) || DOP_3.uchitel,
    },
  };
}

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
  solutionHtml: string;
  /** Ответ: «1,5». */
  answer: string;
}

export interface SobrannyyList3 {
  poVariantam: ListZadacha3[][];
  nehvatka: number;
}

/** Ширина чертежа на листе, мм: сценарий — как на листе печати №3, SVG solid/ — уже. */
const SHIRINA_SCENARIYA = 58;
const SHIRINA_SOLID = 50;

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
): ListZadacha3 {
  const otvet = openText(z.otvet, z.seal);
  const shagi = openText(z.shagi, z.seal)
    .split('\n')
    .filter((t) => t.trim() !== '' && !OTVET.test(t));
  let figure: string | null;
  let figureUchitel: string | null;
  let width: number;
  if (z.scena !== '') {
    /* Листу печати от записи нужны только сценарий и отпечаток. */
    const zp: ZadachaPechati = { ...z, nazvanie: '' };
    figure = chertezhLista(zp, 'uchenik', tex);
    figureUchitel = chertezhLista(zp, 'uchitel', tex);
    width = SHIRINA_SCENARIYA;
  } else {
    figure = d.svg[z.klyuch] ?? d.svg[z.prototip] ?? null;
    figureUchitel = figure;
    width = SHIRINA_SOLID;
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
        return z === undefined ? [] : [zadachaLista(z, d, x.pos, i + 1, x.vid === 'bank')];
      }),
    ),
    nehvatka: plan.nehvatka,
  };
}

/* ── Лист ───────────────────────────────────────────────────────── */

export function subtitleOf(p: SheetParams3): string {
  const vid = p.dop.vid;
  if (vid !== null) return SHEET_GEN_3.vidy[vid];
  return p.dop.svoy !== undefined && p.dop.svoy !== '' ? p.dop.svoy : SHEET_GEN_3.subtitle;
}

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

/* ── Данные ─────────────────────────────────────────────────────── */

let kesh: Promise<Dannye03> | null = null;

/**
 * Задачи №3 — тот же файл, что у «Собрать вариант»: грузится один раз,
 * при первой сборке листа. Сбой сети не застревает в кеше.
 */
export function zagruzitDannye3(): Promise<Dannye03> {
  if (kesh === null) {
    kesh = import('@/lib/dataUrl')
      .then(({ dataUrl }) => fetch(dataUrl('/variant/dannye/z03.json')))
      .then((r) => {
        if (!r.ok) throw new Error(`z03.json: ${r.status}`);
        return r.json() as Promise<Dannye03>;
      });
    kesh.catch(() => {
      kesh = null;
    });
  }
  return kesh;
}
