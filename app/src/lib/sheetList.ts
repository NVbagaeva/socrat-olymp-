/**
 * Лист генератора по модели «блоки → варианты → задачи» (№6, №7, №10:
 * lib/zadanie{6,7,10}/sborka.ts) на общем шаблоне lib/sheet: шапка,
 * поля «Фамилия / Класс / Дата», карточки задач, строка ответа, место
 * для решения, страницы A4.
 *
 * Разметку своих задач даёт раздел (ListSource): условие и рисунок,
 * ответ, разбор кусками, рамки теории, разобранные примеры.
 *
 *   Ученик  — условия с рисунками, строка «Ответ: ____»; у блока урока
 *             «разбор в классе» (mesto) — пустое место для решения.
 *   Учитель — ключ ответов варианта, задачи с ответом и разбор по шагам;
 *             шаги — отдельные куски потока: разбор переносится на
 *             следующую страницу между шагами, а не рвётся посередине.
 */

import { LIST_FOOT, LIST_HEAD, LIST_TEXT } from '@/content/sheetList';
import typo from '@/lib/sheet/typography.js';

export type ListVid = 'uchenik' | 'uchitel';

export interface ListBlok {
  id: string;
  title: string;
  note?: string;
  teoriya?: string[];
  primery?: string[];
  spiski: string[][];
  mesto?: boolean;
}

export interface ListFigure {
  svg: string;
  width?: number;
  below?: boolean;
}

export interface ListSource<Z> {
  /** «Задание 6». */
  chip: string;
  /** Префикс своих классов листа: z6 → z6-sheet-razbor. */
  cls: string;
  model: { zagolovok: string; bloki: readonly ListBlok[] };
  zadacha: (id: string) => Z | undefined;
  id: (z: Z) => string;
  /** Условие (с меткой «аналог») и рисунок отдельно — или null. */
  uslovie: (z: Z) => { html: string; figure: ListFigure | null };
  /** Ответ строкой: «2,5». */
  otvet: (z: Z) => string;
  /** Разбор учителя кусками (шагами), без строки ответа. */
  razbor: (z: Z) => string[];
  /** Рамки теории блока: готовые куски разметки. */
  teoriya: (prototipy: readonly string[]) => string[];
  /** Разобранный пример: готовая разметка рамки. */
  primer: (z: Z) => string;
}

/**
 * Разбор раздела кусками по шагам: <div class="{p}-razbor"> с секциями
 * {p}-razbor__etap и панелью {p}-razbor__calc. Каждый кусок — в своей
 * обёртке, чтобы стили раздела работали; свёрнутая панель «Считаем с
 * умом» на бумаге не печатается — здесь она раскрыта.
 */
export function razborKuski(html: string, p: string): string[] {
  const inner = html
    .replace(new RegExp(`^<div class="${p}-razbor">`), '')
    .replace(/<\/div>$/, '')
    .replace(
      new RegExp(`<details class="${p}-razbor__calc">`, 'g'),
      `<details class="${p}-razbor__calc" open="">`,
    );
  return inner
    .split(new RegExp(`(?=<section class="${p}-razbor__etap|<details class="${p}-razbor__calc")`))
    .filter((part) => part.trim() !== '')
    .map((part) => `<div class="${p}-razbor">${part}</div>`);
}

function item(cls: string, html: string): string {
  return `<div class="sheet-item ${cls}">${html}</div>`;
}

/** Описание листа для buildDocument. */
export function listSheetSpec<Z>(src: ListSource<Z>, vid: ListVid) {
  const c = src.cls;
  const blocks: unknown[] = [];
  for (const b of src.model.bloki) {
    const primery = (b.primery ?? []).flatMap((id) => {
      const z = src.zadacha(id);
      return z === undefined ? [] : [item(`${c}-sheet-primer`, src.primer(z))];
    });
    blocks.push({
      title: b.title,
      note: vid === 'uchitel' ? (b.note ?? '') : '',
      leadItems: [
        ...(b.teoriya ? src.teoriya(b.teoriya).map((h) => item(`${c}-sheet-teoriya`, h)) : []),
        ...primery,
      ],
      tasks: [],
    });
    b.spiski.forEach((spisok, vi) => {
      const zadachi = spisok.flatMap((id) => src.zadacha(id) ?? []);
      const klyuch =
        vid === 'uchitel' && zadachi.length > 0
          ? [
              item(
                `${c}-sheet-klyuch sheet-list-klyuch`,
                `<p><b>${typo.escape(LIST_TEXT.otvety)}:</b> ${zadachi
                  .map((z, k) => `${k + 1}) ${typo.escape(src.otvet(z))}`)
                  .join('; ')}</p>`,
              ),
            ]
          : [];
      if (b.spiski.length > 1 || klyuch.length > 0) {
        blocks.push({
          ...(b.spiski.length > 1
            ? { level: 2, title: LIST_TEXT.variant(vi + 1) }
            : { head: false, title: '' }),
          note: '',
          leadItems: klyuch,
          tasks: [],
        });
      }
      zadachi.forEach((z, k) => {
        const u = src.uslovie(z);
        blocks.push({
          head: false,
          title: '',
          note: '',
          tasks: [
            {
              no: k + 1,
              id: src.id(z),
              questionHtml: u.html,
              options: null,
              figureSvg: u.figure?.svg ?? null,
              figureWidth: u.figure?.width,
              figureBelow: u.figure?.below === true,
              answerLine: vid === 'uchenik',
              /* Разбор в классе (урок): место для решения, как прежде 70 мм. */
              ...(vid === 'uchenik' && b.mesto === true
                ? { space: { mode: 'blank', rows: 14 } }
                : {}),
              solutionHtml:
                vid === 'uchitel'
                  ? `<p class="sheet-list-otvet">${LIST_TEXT.otvet}: <b>${typo.escape(
                      src.otvet(z),
                    )}</b></p>`
                  : null,
            },
          ],
        });
        if (vid === 'uchitel') {
          blocks.push({
            head: false,
            title: '',
            note: '',
            leadItems: src.razbor(z).map((h) => item(`${c}-sheet-razbor sheet-list-razbor`, h)),
            tasks: [],
          });
        }
      });
    });
  }
  const zagolovok = src.model.zagolovok;
  return {
    theme: 'color' as const,
    layout: 'single' as const,
    documentTitle: `${zagolovok} — ${vid === 'uchitel' ? LIST_TEXT.uchitel : LIST_TEXT.uchenik}`,
    head: LIST_HEAD,
    runner: zagolovok,
    title: {
      chip: src.chip,
      text: zagolovok,
      subtitle: vid === 'uchitel' ? LIST_TEXT.uchitel : '',
    },
    recap: null,
    fields: vid === 'uchenik' ? { date: '', group: '' } : null,
    blocks,
    withAnswerLine: vid === 'uchenik',
    foot: LIST_FOOT,
  };
}

/** Шапка листа общего генератора (ps=2, «Дополнительно»): вид работы, дата, учитель, QR. */
export interface ListShapka {
  kind: string;
  /** ГГГГ-ММ-ДД или пусто. */
  date: string;
  uchitel?: string;
  qr: boolean;
}

type ListSpec = ReturnType<typeof listSheetSpec>;

/** «27.10.2026» из записи ГГГГ-ММ-ДД. */
function dataText(iso: string): string {
  return iso === '' ? '' : iso.split('-').reverse().join('.');
}

/**
 * Лист с шапкой общего генератора: вид работы (или podzagolovok) — в
 * подзаголовке, дата — в строке полей, учитель — в шапке страницы,
 * QR-код (готовый SVG) — у названия. Без шапки (прежний адрес, урок)
 * лист не меняется.
 */
export function sShapkoy<S extends ListSpec>(
  spec: S,
  shapka: ListShapka | undefined,
  podzagolovok: string,
  qr?: string,
): S {
  if (shapka === undefined) return spec;
  return {
    ...spec,
    head: { ...spec.head, author: shapka.uchitel ?? spec.head.author },
    title: {
      ...spec.title,
      subtitle: [shapka.kind || podzagolovok, spec.title.subtitle].filter(Boolean).join(' · '),
      ...(shapka.qr && qr !== undefined ? { qr } : {}),
    },
    fields: spec.fields === null ? null : { ...spec.fields, date: dataText(shapka.date) },
  };
}

/**
 * «Всё одним файлом»: лист ученика, затем лист учителя тех же задач —
 * два «варианта» шаблона, у каждого своё начало страницы; у листа
 * учителя строки полей нет.
 */
export function listSheetVse(uchenik: ListSpec, uchitel: ListSpec) {
  return {
    ...uchenik,
    documentTitle: `${uchenik.runner} — ${LIST_TEXT.uchenik}, ${LIST_TEXT.uchitel.toLowerCase()}`,
    blocks: [],
    variants: [
      { title: uchenik.title, blocks: uchenik.blocks },
      { title: uchitel.title, fields: null, blocks: uchitel.blocks },
    ],
  };
}
