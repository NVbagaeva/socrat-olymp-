/**
 * Описание листа генератора №13 для lib/sheet (02-design.md, § 5.5).
 *
 * Ученику — условия без подписи типа: схему ученик определяет сам. На
 * компактном листе под условием строка «Ответ: ____», на листе «С
 * полями» — «Дано», «Найти», пустая таблица по периодам, поле «Решение»
 * и строка ответа. В «Определи тип» — строки «Схема» и «Признак». С
 * подсказкой — одна рамка «Повторяем» в начале листа. Учителю — сводка
 * ответов, затем решения; тип называется первым шагом решения. Зачёт:
 * первая страница — как выполнять, баллы и шкала, дальше задачи блоков
 * 1–4 по одной на страницу; у ученика блоки без названий схем.
 */

import answers from '../../sheet/answers.js';
import { BLOK_13, RAMKA_13, SHEET_13, ZACHET_13, type Vid13 } from '@/content/generator13';
import { LIST_UROKA_13 } from '@/content/repetitory13';
import { typeset } from '../../tex';
import { TABLE_HEAD } from '../tablica';
import type { List13, ListZadacha13 } from './list';
import { tablitsaUsloviya13 } from './list';
import { urokPo13, type GenParams13 } from './params';

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

/**
 * Пустая таблица по периодам: сокращённые строки 1, 2, 3, …, n.
 * Подписи столбцов пустые — по ним угадывалась бы схема («Вклад на
 * начало», «Долг после начисления»): столбцы ученик подписывает сам.
 */
function pustayaTablitsa(z: ListZadacha13): string {
  const m = z.task.tableModel;
  const h = TABLE_HEAD[m.scheme];
  const head =
    `<th scope="col">${escape(h.period[m.period])}</th>` +
    h.cols.map(() => '<th scope="col"></th>').join('');
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
      /* Над условием ничего: схему ученик определяет сам. */
      questionHtml: z.questionHtml,
      options: null,
      figureSvg: null,
      solutionHtml: tablitsa + niz,
    };
  };
}

function stroOtveta(z: ListZadacha13): string {
  return `<p class="sheet-task-answer">${SHEET_13.otvet}: <b>${escape(z.answer)}</b>${metka(z)}</p>`;
}

function uchitelTask(p: GenParams13) {
  return (z: ListZadacha13): SheetTask => ({
    no: z.no,
    id: z.pos,
    /* Условие — как у ученика: автотест комплектов сверяет их. Тип
       называется в решении (шаг «Определяем тип»), пометка «не из
       открытого банка» — у ответа. Решение идёт после карточки
       отдельными кусками (posleZadachi): длинное решение переносится
       по шагам, а не обрезается. «Только ответы» — ответ в карточке. */
    questionHtml: z.questionHtml,
    options: null,
    figureSvg: null,
    solutionHtml: tablitsaUsloviya13(z) + (p.uchitel === 'otvety' ? stroOtveta(z) : ''),
  });
}

/** Решение учителя после карточки задачи: по куску потока на шаг и строка ответа. */
function posleZadachi(p: GenParams13) {
  return (z: ListZadacha13): string[] =>
    p.uchitel === 'otvety'
      ? []
      : [
          ...(p.uchitel === 'polno' ? z.polno : z.kratko).map(
            (html) => `<div class="sheet-item z13-sheet-reshenie-shag">${html}</div>`,
          ),
          `<div class="sheet-item z13-sheet-reshenie-shag">${stroOtveta(z)}</div>`,
        ];
}

/** Схемы в рамке «Повторяем»: все четыре всегда — по составу рамки схему не угадать. */
const SKHEMY_POVTORA: readonly Vid13[] = ['A', 'B', 'C', 'D'];

/**
 * Рамка «Повторяем» — одна, в начале листа: правила всех схем с
 * разобранными примерами. Перед задачами своего типа она не стоит,
 * иначе подсказала бы метод.
 */
function povtor(zs: ListZadacha13[]): string {
  const vidy = [
    ...SKHEMY_POVTORA,
    ...(['T', 'P'] as const).filter((v) => zs.some((z) => z.vid === v)),
  ];
  const pravila = vidy
    .map((vid) => {
      const r = RAMKA_13[vid];
      return (
        `<div class="z13-sheet-povtor__item"><p class="sheet-example-title">${typeset(r.pravilo)}</p>` +
        `<p class="sheet-task-question">${typeset(r.primer)}</p>` +
        `<div class="sheet-task-solution"><p>${typeset(r.reshenie)}</p></div></div>`
      );
    })
    .join('');
  return (
    `<div class="sheet-item sheet-example z13-sheet-povtor">` +
    `<span class="sheet-example-label">${SHEET_13.ramka}</span>` +
    `<div class="sheet-example-text">${pravila}</div></div>`
  );
}

/** «Блок 2 · задачи 6–10»; учителю — с названием схемы. «Определи тип» — всегда с названием. */
function nazvanieBloka(
  no: number,
  vid: Vid13,
  ot: number,
  kolvo: number,
  uchenik: boolean,
): string {
  const zadachi = `${ZACHET_13.zadachiMal} ${ot}–${ot + kolvo - 1}`;
  return uchenik && vid !== 'T'
    ? `${ZACHET_13.blok} ${no} · ${zadachi}`
    : `${ZACHET_13.blok} ${no}. ${escape(BLOK_13[vid])} · ${zadachi}`;
}

function zagolovokBloka(title: string): string {
  return (
    `<div class="sheet-item sheet-block" data-page-break="1" data-keep-with-next="1">` +
    `<header class="sheet-block-head"><h2 class="sheet-block-title">${title}</h2></header></div>`
  );
}

/**
 * Блоки листа одного варианта. Обычный лист — один блок без заголовка:
 * задачи в порядке плана (он уже перемешан). Зачёт — блоки по схемам,
 * у ученика без названий схем, в блоках 1–4 — по задаче на страницу.
 */
function bloki(
  p: GenParams13,
  zs: ListZadacha13[],
  task: (z: ListZadacha13) => SheetTask,
  uchenik: boolean,
  posle?: (z: ListZadacha13) => string[],
): SheetBlock[] {
  const lead = uchenik && p.pomoshch === 'ramka' ? [povtor(zs)] : [];
  /* Куски после задачи — отдельный блок без задач и без заголовка. */
  const hvost = (z: ListZadacha13): SheetBlock[] => {
    const items = posle?.(z) ?? [];
    return items.length === 0
      ? []
      : [{ title: '', note: '', head: false, leadItems: items, tasks: [] }];
  };
  if (p.urok > 0) {
    return blokiUroka(zs, task, lead, hvost);
  }
  if (!p.zachet) {
    if (posle === undefined) {
      return [{ title: '', note: '', head: false, leadItems: lead, tasks: zs.map(task) }];
    }
    return zs.flatMap((z, i) => [
      { title: '', note: '', head: false, leadItems: i === 0 ? lead : [], tasks: [task(z)] },
      ...hvost(z),
    ]);
  }
  const vidy = [...new Set(zs.map((z) => z.vid))];
  const out: SheetBlock[] = [];
  vidy.forEach((vid, bi) => {
    const svoi = zs.filter((z) => z.vid === vid);
    const ot = svoi[0]?.no ?? 1;
    const poOdnoy = uchenik && vid !== 'T';
    svoi.forEach((z, i) => {
      out.push({
        title: '',
        note: '',
        head: false,
        leadItems:
          i === 0
            ? [
                zagolovokBloka(nazvanieBloka(bi + 1, vid, ot, svoi.length, uchenik)),
                ...(bi === 0 ? lead : []),
              ]
            : poOdnoy
              ? [RAZRYV]
              : [],
        tasks: [task(z)],
      });
      out.push(...hvost(z));
    });
  });
  return out;
}

/** Заголовок части листа урока: без разрыва страницы, держится со следующей задачей. */
function zagolovokChasti(title: string): string {
  return (
    `<div class="sheet-item sheet-block" data-keep-with-next="1">` +
    `<header class="sheet-block-head"><h2 class="sheet-block-title">${title}</h2></header></div>`
  );
}

/**
 * Лист урока: части «Опорные задачи», «Задачи открытого банка»,
 * «Новые задачи», «Определи тип» — по порядку плана, у каждой свой
 * заголовок. Схему части не называют: в уроке она одна, а тему урока
 * ученику не пишем.
 */
function blokiUroka(
  zs: ListZadacha13[],
  task: (z: ListZadacha13) => SheetTask,
  lead: string[],
  hvost: (z: ListZadacha13) => SheetBlock[],
): SheetBlock[] {
  return zs.flatMap((z, i) => {
    const prev = zs[i - 1];
    const novayaChast = z.chast !== undefined && z.chast !== prev?.chast;
    const leadItems = [
      ...(i === 0 ? lead : []),
      ...(novayaChast && z.chast ? [zagolovokChasti(LIST_UROKA_13.chasti[z.chast])] : []),
    ];
    return [{ title: '', note: '', head: false, leadItems, tasks: [task(z)] }, ...hvost(z)];
  });
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
      /* Схему блока на листе ученика не называем: только «Определи тип». */
      const imya = vid === 'T' ? `. ${escape(BLOK_13[vid])}` : '';
      const row = `<tr><td>${ZACHET_13.blok} ${i + 1}${imya}</td><td>${ot}–${ot + n - 1}</td><td>${n * ball}</td><td></td></tr>`;
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
  const urok = p.urok > 0 ? urokPo13(p.urok) : undefined;
  const zagolovokDlya = (uchitel: boolean) =>
    urok === undefined
      ? p.title || SHEET_13.text
      : uchitel
        ? LIST_UROKA_13.uchitel(urok.no, urok.title)
        : LIST_UROKA_13.uchenik(urok.no);
  const zagolovok = zagolovokDlya(vid === 'uchitel');
  const title = (variant: number | null, uchitel: boolean) => ({
    chip: SHEET_13.chip,
    text: uchitel ? `${zagolovokDlya(true)} · ${SHEET_13.resheniya}` : zagolovokDlya(false),
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
    const b = bloki(p, zs, uchitelTask(p), false, posleZadachi(p));
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
