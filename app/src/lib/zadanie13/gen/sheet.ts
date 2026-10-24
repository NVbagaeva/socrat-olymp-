/**
 * Описание листа генератора №13 для lib/sheet (02-design.md, § 5.5).
 *
 * Ученику — условия; на компактном листе под условием строка
 * «Ответ: ____», на листе «С полями» — «Дано», «Найти», пустая таблица
 * по периодам в нужном формате, поле «Решение» и строка ответа. В
 * «Определи тип» — строки «Схема» и «Признак». С подсказкой перед
 * первой задачей каждого типа — рамка «Правило и пример». Учителю —
 * сводка ответов, затем краткие или полные решения. Зачёт: первая
 * страница — как выполнять, баллы и шкала, дальше задачи блоков 1–4
 * по одной на страницу.
 */

import answers from '../../sheet/answers.js';
import { exampleItem } from '../../sheet/sheet.js';
import { BLOK_13, RAMKA_13, SHEET_13, ZACHET_13, type Vid13 } from '@/content/generator13';
import { typeset } from '../../tex';
import { TABLE_HEAD } from '../tablica';
import type { List13, ListZadacha13 } from './list';
import { tablitsaUsloviya13 } from './list';
import type { GenParams13 } from './params';

export type VidPechati13 = 'uchenik' | 'uchitel' | 'vse';

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

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

const RAZRYV = '<div class="sheet-item z13-sheet-break" data-page-break="1"></div>';

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Пустая таблица по периодам: сокращённые строки 1, 2, 3, …, n. */
function pustayaTablitsa(z: ListZadacha13): string {
  const m = z.task.tableModel;
  const h = TABLE_HEAD[m.scheme];
  const head = [h.period[m.period], ...h.cols]
    .map((c) => `<th scope="col">${escape(c)}</th>`)
    .join('');
  const rows = m.show
    .map((i) => {
      const label = i === 0 ? '…' : escape(m.labels[i - 1] ?? String(i));
      return `<tr><th scope="row">${label}</th>${h.cols.map(() => '<td></td>').join('')}</tr>`;
    })
    .join('');
  return `<table class="z13-sheet-pusto"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function polyaOformleniya(z: ListZadacha13): string {
  return (
    `<div class="z13-sheet-dano"><div class="z13-sheet-kletka"><span>${SHEET_13.dano}</span></div>` +
    `<div class="z13-sheet-kletka"><span>${SHEET_13.nayti}</span></div></div>` +
    pustayaTablitsa(z) +
    `<div class="z13-sheet-reshenie"><span>${SHEET_13.reshenie}</span></div>`
  );
}

const STROKI_TIPA =
  `<p class="sheet-answer-line">${SHEET_13.tipSkhema}<span class="sheet-answer-blank"></span></p>` +
  `<p class="sheet-answer-line">${SHEET_13.tipPriznak}<span class="sheet-answer-blank"></span></p>`;

function metka(z: ListZadacha13): string {
  return z.task.source === 'own'
    ? ` <span class="z13-sheet-metka">${SHEET_13.metkaSvoya}</span>`
    : '';
}

function podpisTipa(z: ListZadacha13, p: GenParams13): string {
  /* В «Определи тип» схему не подписываем — её и надо назвать. */
  if (z.vid === 'T' || p.zachet) return '';
  return `<span class="z13-sheet-tip">${escape(BLOK_13[z.vid])}</span><br>`;
}

function uchenikTask(p: GenParams13) {
  return (z: ListZadacha13): SheetTask => {
    const tablitsa = tablitsaUsloviya13(z);
    const niz =
      z.vid === 'T'
        ? STROKI_TIPA
        : p.vid === 'full' || p.zachet
          ? polyaOformleniya(z) + STROKA_OTVETA
          : STROKA_OTVETA;
    return {
      no: z.no,
      id: z.pos,
      questionHtml: podpisTipa(z, p) + z.questionHtml,
      options: null,
      figureSvg: null,
      solutionHtml: tablitsa + niz,
    };
  };
}

function uchitelTask(p: GenParams13) {
  return (z: ListZadacha13): SheetTask => {
    const reshenie =
      p.uchitel === 'otvety' ? '' : p.uchitel === 'polno' ? z.polnoHtml : z.kratkoHtml;
    return {
      no: z.no,
      id: z.pos,
      /* Условие — как у ученика: автотест комплектов сверяет их. Схема и
         пометка «не из открытого банка» — в решении, только учителю. */
      questionHtml: podpisTipa(z, p) + z.questionHtml,
      options: null,
      figureSvg: null,
      solutionHtml:
        tablitsaUsloviya13(z) +
        `<p class="z13-sheet-tip">${escape(BLOK_13[z.vid])}${metka(z)}</p>` +
        reshenie +
        `<p class="sheet-task-answer">${SHEET_13.otvet}: <b>${escape(z.answer)}</b></p>`,
    };
  };
}

function ramka(vid: Vid13): string {
  const r = RAMKA_13[vid];
  return exampleItem({
    label: SHEET_13.ramka,
    title: typeset(r.pravilo),
    conditionHtml: typeset(r.primer),
    solutionHtml: `<p>${typeset(r.reshenie)}</p>`,
  });
}

function zagolovokBloka(no: number, vid: Vid13, razryv: boolean): string {
  return (
    `<div class="sheet-item sheet-block"${razryv ? ' data-page-break="1"' : ''} data-keep-with-next="1">` +
    `<header class="sheet-block-head"><h2 class="sheet-block-title">${ZACHET_13.blok} ${no}. ${escape(BLOK_13[vid])}</h2></header></div>`
  );
}

/** Блоки листа одного варианта: по строкам «Что», в порядке листа. */
function bloki(
  p: GenParams13,
  zs: ListZadacha13[],
  task: (z: ListZadacha13) => SheetTask,
  uchenik: boolean,
): SheetBlock[] {
  const vidy = [...new Set(zs.map((z) => z.vid))];
  const out: SheetBlock[] = [];
  vidy.forEach((vid, bi) => {
    const svoi = zs.filter((z) => z.vid === vid);
    const lead = uchenik && p.pomoshch === 'ramka' ? [ramka(vid)] : [];
    if (p.zachet) {
      /* Зачёт: заголовок блока с новой страницы; в блоках 1–4 — по
         задаче на страницу, «Определи тип» — подряд. */
      const poOdnoy = uchenik && vid !== 'T';
      svoi.forEach((z, i) => {
        out.push({
          title: '',
          note: '',
          head: false,
          leadItems:
            i === 0 ? [zagolovokBloka(bi + 1, vid, true), ...lead] : poOdnoy ? [RAZRYV] : [],
          tasks: [task(z)],
        });
      });
      return;
    }
    out.push({
      title: BLOK_13[vid],
      note: '',
      head: false,
      leadItems: lead,
      tasks: svoi.map(task),
    });
  });
  return out;
}

/** Первая страница зачёта: как выполнять, таблица баллов, шкала. */
function stranicaZacheta(zs: ListZadacha13[]): string {
  const vidy = [...new Set(zs.map((z) => z.vid))];
  let ot = 1;
  let vsego = 0;
  const stroki = vidy
    .map((vid, i) => {
      const n = zs.filter((z) => z.vid === vid).length;
      const ball = vid === 'T' ? ZACHET_13.bally.tip : ZACHET_13.bally.zadacha;
      vsego += n * ball;
      const row = `<tr><td>${i + 1}. ${escape(BLOK_13[vid])}</td><td>${ot}–${ot + n - 1}</td><td>${n * ball}</td><td></td></tr>`;
      ot += n;
      return row;
    })
    .join('');
  const shkala = ZACHET_13.shkala
    .map(
      (s) =>
        `<div class="z13-sheet-shkala__item"><b>${s.otmetka}</b><span>${s.ot}–${s.do}</span></div>`,
    )
    .join('');
  return (
    `<div class="sheet-item z13-sheet-zachet">` +
    `<h2 class="sheet-block-title">${ZACHET_13.kak}</h2>` +
    `<ol class="z13-sheet-pravila">${ZACHET_13.pravila.map((t) => `<li>${escape(t)}</li>`).join('')}</ol>` +
    `<table class="z13-sheet-bally"><caption>${ZACHET_13.ballyTitle}</caption>` +
    `<thead><tr><th>${ZACHET_13.blok}</th><th>${ZACHET_13.zadachi}</th><th>${ZACHET_13.ballov}</th><th>${ZACHET_13.nabrano}</th></tr></thead>` +
    `<tbody>${stroki}<tr class="z13-sheet-bally__itog"><td>${ZACHET_13.itogo}</td><td></td><td>${vsego}</td><td></td></tr></tbody></table>` +
    `<div class="z13-sheet-shkala">${shkala}</div>` +
    `<p class="z13-sheet-note">${escape(ZACHET_13.ballyNote)}</p>` +
    `<p class="z13-sheet-note"><b>${escape(ZACHET_13.zachet)}</b></p>` +
    `</div>`
  );
}

export function sheetSpec13(p: GenParams13, list: List13, vid: VidPechati13) {
  const nV = list.poVariantam.length;
  const zagolovok = p.title || SHEET_13.text;
  const title = (variant: number | null, uchitel: boolean) => ({
    chip: SHEET_13.chip,
    text: uchitel ? `${zagolovok} · ${SHEET_13.resheniya}` : zagolovok,
    subtitle: SHEET_13.text,
    ...(variant === null || nV === 1 ? {} : { variant: `Вариант ${variant + 1}` }),
  });
  const svodka = (zs: ListZadacha13[], i: number) =>
    answers.table(
      nV > 1 ? `${SHEET_13.svodka}. Вариант ${i + 1}` : SHEET_13.svodka,
      zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
      4,
    );
  const uchenikVariant = (zs: ListZadacha13[], i: number) => {
    const b = bloki(p, zs, uchenikTask(p), true);
    if (p.zachet && b[0] !== undefined) {
      b[0] = { ...b[0], leadItems: [stranicaZacheta(zs), ...(b[0].leadItems ?? [])] };
    }
    return { title: title(i, false), blocks: b };
  };
  const uchitelVariant = (zs: ListZadacha13[], i: number) => {
    const b = bloki(p, zs, uchitelTask(p), false);
    if (b[0] !== undefined) {
      b[0] = { ...b[0], leadItems: [svodka(zs, i), ...(b[0].leadItems ?? [])] };
    }
    return { title: title(i, true), blocks: b };
  };
  const variants =
    vid === 'uchenik'
      ? list.poVariantam.map(uchenikVariant)
      : vid === 'uchitel'
        ? list.poVariantam.map(uchitelVariant)
        : [...list.poVariantam.map(uchenikVariant), ...list.poVariantam.map(uchitelVariant)];
  const one = variants.length === 1 ? variants[0] : undefined;
  return {
    theme: p.theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_13.chip}. ${zagolovok}`,
    head: { ...SHEET_13.head, author: p.teacher || SHEET_13.uchitel },
    runner: SHEET_13.runner,
    title: one?.title ?? title(null, vid === 'uchitel'),
    recap: null,
    blocks: one?.blocks ?? [],
    /* Строка «Фамилия, имя / Класс / Дата» — только на листе ученика. */
    ...(vid === 'uchitel' ? {} : { fields: { date: p.date } }),
    ...(one === undefined ? { variants } : {}),
    withAnswerLine: false,
    extraItems: [] as string[],
    foot: SHEET_13.foot,
  };
}
