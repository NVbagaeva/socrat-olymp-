/**
 * Лист для печати раздела «Наибольшее и наименьшее значение функции»:
 * адрес → задачи → описание листа для общего шаблона lib/sheet/.
 *
 * Адрес — схема общего генератора (ps=2, как у №2): состав по
 * прототипам с числом задач и ключами позиций, варианты, замены, вид
 * работы, дата, учитель, QR-код. Задача позиции — по seed листа,
 * варианту и ключу: один и тот же адрес всегда даёт один и тот же лист,
 * а листы ученика и учителя по одному адресу — одни и те же задачи.
 */

import type { SheetLayoutId, SheetThemeId } from '@/content/generator';
import { SHEET_21 } from '@/content/sheet21';
import {
  klyuchSlota,
  razobratSostav,
  slotySostava,
  sostavIzSlotov,
  sostavStroka,
} from '@/lib/generator/obshchiy/klyuchi';
import answers from '@/lib/sheet/answers.js';
import { rngOf } from '@/lib/vychisleniya/rng';
import { typeset } from '../tex';
import { PROTOTYPES, prototype } from './prototypes';
import { chislo } from './tex';
import type { Solved } from './types';

export interface SheetParams21 {
  sostav: { id: string; n: number; k?: number }[];
  /** Вариантов одной структуры: 1–4. */
  variants: number;
  seed: string;
  theme: SheetThemeId;
  layout: SheetLayoutId;
  /** Вид работы: подзаголовок листа. */
  kind: string;
  /** Дата в подзаголовке, ГГГГ-ММ-ДД. Пусто — даты нет. */
  date: string;
  /** Замены: «вариант.ключ» («2.P06_0») → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Учитель в шапке; нет — как в шаблоне. */
  uchitel?: string;
  qr?: boolean;
}

export const VARIANTS_MAX = 4;
const est = (id: string) => PROTOTYPES.some((p) => p.id === id);

/** Строка адреса из параметров. */
export function sheetQuery21(params: SheetParams21): string {
  const q = new URLSearchParams();
  q.set('ps', '2');
  q.set('s', sostavStroka(params.sostav));
  if (params.variants > 1) q.set('v', String(params.variants));
  q.set('seed', params.seed);
  q.set('t', params.theme);
  q.set('c', params.layout === 'double' ? '2' : '1');
  if (params.kind !== '') q.set('k', params.kind);
  if (params.date !== '') q.set('d', params.date);
  if (params.uchitel !== undefined && params.uchitel !== SHEET_21.head.author) {
    q.set('uch', params.uchitel);
  }
  if (params.qr === true) q.set('qr', '1');
  const z = Object.entries(params.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  return q.toString();
}

/** Параметры из адреса. Чего в адресе нет — по умолчанию. */
export function parseSheetQuery21(query: URLSearchParams): SheetParams21 {
  const sostav = sostavIzSlotov(
    slotySostava(razobratSostav(query.get('s') ?? '', true, /P\d{2}/, est)),
  );
  const variants = Number(query.get('v'));
  const zameny: Record<string, number> = {};
  for (const item of (query.get('z') ?? '').split(',')) {
    const [pos = '', k = ''] = item.split(':');
    if (/^\d+\.P\d{2}_\d{1,3}$/.test(pos) && Number(k) > 0) zameny[pos] = Math.min(50, Number(k));
  }
  return {
    sostav,
    variants:
      Number.isFinite(variants) && variants > 1 ? Math.min(VARIANTS_MAX, Math.floor(variants)) : 1,
    seed: (query.get('seed') ?? 'variant').slice(0, 24),
    theme: query.get('t') === 'print' ? 'print' : 'color',
    layout: query.get('c') === '2' ? 'double' : 'single',
    kind: (query.get('k') ?? '').slice(0, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.get('d') ?? '') ? (query.get('d') as string) : '',
    zameny,
    ...(query.has('uch')
      ? {
          uchitel: (query.get('uch') ?? '')
            .replace(/[\u0000-\u001f<>]/g, '')
            .trim()
            .slice(0, 40),
        }
      : {}),
    ...(query.get('qr') === '1' ? { qr: true } : {}),
  };
}

export interface SheetTask21 {
  pos: string;
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  answer: string;
  answerHtml: null;
  solutionHtml: string | null;
}

export interface SheetBlock21 {
  id: string;
  title: string;
  note: string;
  set: string;
  tasks: SheetTask21[];
}

interface Postroennaya {
  uslovie: string;
  solved: Solved;
}

/** Задача позиции: по seed; повтор условия на одной позиции пропускается. */
function zadachaPozicii(
  id: string,
  seed: string,
  nePovtor: ReadonlySet<string> = new Set(),
): Postroennaya {
  const proto = prototype(id);
  let poslednyaya: Postroennaya | null = null;
  for (let a = 0; a < 30; a += 1) {
    const params = proto.gen(rngOf(a === 0 ? seed : `${seed}~${a}`));
    const z = { uslovie: proto.uslovie(params), solved: proto.solve(params) };
    poslednyaya = z;
    if (!nePovtor.has(z.uslovie)) return z;
  }
  return poslednyaya as Postroennaya;
}

/** Разбор по шагам без строки «Ответ» — она идёт под разбором отдельно. */
export function shagiHtml21(solved: Solved): string {
  const items = solved.etapy
    .filter((e) => e.title !== 'Ответ')
    .map(
      (e) =>
        `<li class="sheet-step"><b>${typeset(e.title.replace(/^Шаг \d+\.\s*/, ''))}.</b> ${e.lines.map((l) => typeset(l)).join(' ')}</li>`,
    )
    .join('');
  return `<ol class="sheet-steps">${items}</ol>`;
}

function sheetTask(
  z: Postroennaya,
  id: string,
  pos: string,
  no: number,
  withAnswers: boolean,
): SheetTask21 {
  const otvet = chislo(z.solved.answer);
  return {
    pos,
    no,
    id,
    questionHtml: typeset(z.uslovie),
    options: null,
    figureSvg: null,
    answer: withAnswers ? otvet : '',
    answerHtml: null,
    solutionHtml: withAnswers
      ? `${shagiHtml21(z.solved)}<p class="sheet-task-answer">Ответ: <b>${otvet}</b></p>`
      : null,
  };
}

/** Блоки варианта: позиции по порядку состава, блок — подряд идущие задачи одного прототипа. */
export function sheetBlocks21(
  params: SheetParams21,
  withAnswers: boolean,
  variant = 1,
): SheetBlock21[] {
  const out: SheetBlock21[] = [];
  let no = 0;
  for (const slot of slotySostava(params.sostav)) {
    const key = `${variant}.${klyuchSlota(slot)}`;
    const base = `${params.seed}|${variant}|${klyuchSlota(slot)}`;
    const zamen = params.zameny[key] ?? 0;
    let z = zadachaPozicii(slot.id, base);
    const bylo = new Set([z.uslovie]);
    for (let j = 1; j <= zamen; j += 1) {
      z = zadachaPozicii(slot.id, `${base}|z${j}`, bylo);
      bylo.add(z.uslovie);
    }
    no += 1;
    const t = sheetTask(z, slot.id, key, no, withAnswers);
    const last = out[out.length - 1];
    if (last !== undefined && last.id === slot.id) last.tasks.push(t);
    else
      out.push({
        id: slot.id,
        title: typeset(prototype(slot.id).title),
        note: '',
        set: slot.id,
        tasks: [t],
      });
  }
  return out;
}

export function sheetVariants21(params: SheetParams21, withAnswers: boolean): SheetBlock21[][] {
  return Array.from({ length: params.variants }, (_, i) =>
    sheetBlocks21(params, withAnswers, i + 1),
  );
}

/** «18.09.2026» из записи ГГГГ-ММ-ДД. */
function dateText(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Подзаголовок листа: вид работы и дата, что есть. */
export function subtitleOf21(params: Pick<SheetParams21, 'kind' | 'date'>): string {
  return [params.kind, params.date === '' ? '' : dateText(params.date)]
    .filter((x) => x !== '')
    .join(' · ');
}

function answersItems(variants: SheetBlock21[][]): string[] {
  const items: string[] = [
    answers.sectionHead('Ответы', 'по типам, сквозная нумерация', { section: variants.length > 1 }),
  ];
  variants.forEach((blocks, i) => {
    if (variants.length > 1) items.push(answers.subHead(`Вариант ${i + 1}`));
    for (const block of blocks) {
      items.push(
        answers.table(
          block.title,
          block.tasks.map((task) => ({ no: task.no, answer: task.answer, html: null })),
          5,
        ),
      );
    }
  });
  return items;
}

function titleOf(params: SheetParams21, variant?: string, qrSvg?: string) {
  return {
    chip: SHEET_21.title.chip,
    text: SHEET_21.title.text,
    subtitle: subtitleOf21(params) || SHEET_21.title.subtitle,
    ...(variant === undefined ? {} : { variant }),
    ...(params.qr === true && qrSvg !== undefined ? { qr: qrSvg } : {}),
  };
}

/** Описание листа для шаблона: ученику — строка «Ответ: ____», учителю — разбор и таблица ответов. */
export function sheetSpec21(params: SheetParams21, withAnswers: boolean, qrSvg?: string) {
  const variants = sheetVariants21(params, withAnswers);
  return {
    theme: params.theme,
    layout: params.layout,
    cell: params.layout === 'double' ? 3.0 : 3.4,
    documentTitle:
      `${SHEET_21.title.chip}. ${SHEET_21.title.text}` + (params.kind ? ` — ${params.kind}` : ''),
    head:
      params.uchitel === undefined ? SHEET_21.head : { ...SHEET_21.head, author: params.uchitel },
    runner: SHEET_21.runner,
    title: titleOf(params, undefined, qrSvg),
    recap: null,
    blocks: variants[0] ?? [],
    fields: { date: params.date === '' ? '' : dateText(params.date) },
    ...(variants.length > 1
      ? {
          variants: variants.map((list, i) => ({
            title: titleOf(params, `Вариант ${i + 1}`, qrSvg),
            blocks: list,
          })),
        }
      : {}),
    withAnswerLine: !withAnswers,
    extraItems: withAnswers ? answersItems(variants) : [],
    foot: SHEET_21.foot,
  };
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

/** «Всё одним файлом»: листы ученика всех вариантов, затем листы учителя и ответы. */
export function sheetSpecVse21(params: SheetParams21, qrSvg?: string) {
  const uchenik = sheetVariants21(params, false);
  const uchitel = sheetVariants21(params, true);
  const n = uchenik.length;
  const nazvanie = (i: number, reshenie: boolean) => {
    const t = titleOf(params, n > 1 ? `Вариант ${i + 1}` : undefined, qrSvg);
    return reshenie
      ? { ...t, subtitle: [t.subtitle, SHEET_21.resheniya].filter(Boolean).join(' · ') }
      : t;
  };
  return {
    ...sheetSpec21(params, true, qrSvg),
    blocks: [],
    variants: [
      ...uchenik.map((blocks, i) => ({
        title: nazvanie(i, false),
        blocks: blocks.map((b) => ({
          ...b,
          tasks: b.tasks.map((t) => ({ ...t, solutionHtml: STROKA_OTVETA })),
        })),
      })),
      ...uchitel.map((blocks, i) => ({ title: nazvanie(i, true), blocks })),
    ],
    withAnswerLine: false,
  };
}
